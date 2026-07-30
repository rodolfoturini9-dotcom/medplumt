#!/usr/bin/env python3
"""
Consulta a base RAG unificada (rag_isls.sqlite) — protocolos clínicos e
base de medicamentos — via full-text search FTS5/BM25.

Uso:
  python3 consultar_rag.py "crise hipertensiva"
  python3 consultar_rag.py --tipo medicamento "dipirona"
  python3 consultar_rag.py --tipo documento --categoria protocolo_clinico "cetoacidose"
  python3 consultar_rag.py --limite 10 "amoxicilina clavulanato"

Requer apenas Python 3 com sqlite3 (biblioteca padrão) — sem dependências
externas. Pensado para ser chamado por um agente de IA (tool call /
subprocess) ou por qualquer sistema clínico local.
"""
import sqlite3
import argparse
import json
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "rag_isls.sqlite")


def buscar_documentos(con, query, categoria=None, limite=8):
    sql = """
        SELECT d.id, d.titulo, d.categoria, d.arquivo_fonte,
               d.chunk_index, d.chunk_total, d.conteudo,
               bm25(documentos_fts) AS score
        FROM documentos_fts
        JOIN documentos d ON d.rowid = documentos_fts.rowid
        WHERE documentos_fts MATCH ?
    """
    params = [query]
    if categoria:
        sql += " AND d.categoria = ?"
        params.append(categoria)
    sql += " ORDER BY score LIMIT ?"
    params.append(limite)
    cur = con.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def buscar_medicamentos(con, query, contexto=None, limite=8):
    sql = """
        SELECT m.uid, m.nome_display, m.contexto, m.fonte, m.calcula_por_peso, m.dados_json
        FROM medicamentos_fts f
        JOIN medicamentos m ON m.uid = f.uid
        WHERE medicamentos_fts MATCH ?
    """
    params = [query]
    if contexto:
        sql += " AND m.contexto = ?"
        params.append(contexto)
    sql += " LIMIT ?"
    params.append(limite)
    cur = con.execute(sql, params)
    cols = [c[0] for c in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    for r in rows:
        r["dados"] = json.loads(r.pop("dados_json"))
    return rows


def main():
    ap = argparse.ArgumentParser(description="Consulta RAG — ISLS")
    ap.add_argument("query", help="termos de busca (linguagem natural ou palavras-chave)")
    ap.add_argument("--tipo", choices=["documento", "medicamento", "ambos"], default="ambos")
    ap.add_argument("--categoria", default=None,
                     help="filtro de categoria de documento (ex.: protocolo_clinico, farmacologia_classe)")
    ap.add_argument("--contexto", default=None,
                     help="filtro de contexto de medicamento (ex.: ambulatorial_pediatrico)")
    ap.add_argument("--limite", type=int, default=8)
    ap.add_argument("--json", action="store_true", help="saída em JSON puro")
    args = ap.parse_args()

    con = sqlite3.connect(DB_PATH)
    resultado = {}

    if args.tipo in ("documento", "ambos"):
        resultado["documentos"] = buscar_documentos(con, args.query, args.categoria, args.limite)
    if args.tipo in ("medicamento", "ambos"):
        resultado["medicamentos"] = buscar_medicamentos(con, args.query, args.contexto, args.limite)

    con.close()

    if args.json:
        print(json.dumps(resultado, ensure_ascii=False, indent=2))
        return

    for doc in resultado.get("documentos", []):
        print(f"\n[DOC] {doc['titulo']} ({doc['categoria']}) — {doc['arquivo_fonte']} "
              f"[chunk {doc['chunk_index']}/{doc['chunk_total']}] score={doc['score']:.2f}")
        trecho = doc["conteudo"][:300].replace("\n", " ")
        print(f"  {trecho}...")

    for med in resultado.get("medicamentos", []):
        print(f"\n[MED] {med['nome_display']} — {med['contexto']} ({med['fonte']})")


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(__doc__)
        sys.exit(0)
    main()
