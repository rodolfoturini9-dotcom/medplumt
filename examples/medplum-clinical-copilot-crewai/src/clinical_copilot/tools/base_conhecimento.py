"""Tool CrewAI sobre a base de conhecimento clínico (`knowledge/kb/06_rag_sistema_unificado`).

Reusa a mesma lógica de `consultar_rag.py` (fornecido junto com a base): busca
full-text (FTS5/BM25) em `rag_isls.sqlite`, sem dependências externas. Não
reimplementa RAG por embeddings — a base já vem com um índice full-text
pronto e testado, então só expomos essa consulta como tool.
"""

from __future__ import annotations

import json
import os
import sqlite3
from typing import Any

from crewai.tools import tool

_KB_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "..",
    "knowledge",
    "kb",
    "06_rag_sistema_unificado",
)
DB_PATH = os.path.normpath(os.path.join(_KB_DIR, "rag_isls.sqlite"))


def _buscar_documentos(con: sqlite3.Connection, query: str, categoria: str | None, limite: int) -> list[dict[str, Any]]:
    sql = """
        SELECT d.titulo, d.categoria, d.arquivo_fonte,
               d.chunk_index, d.chunk_total, d.conteudo,
               bm25(documentos_fts) AS score
        FROM documentos_fts
        JOIN documentos d ON d.rowid = documentos_fts.rowid
        WHERE documentos_fts MATCH ?
    """
    params: list[Any] = [query]
    if categoria:
        sql += " AND d.categoria = ?"
        params.append(categoria)
    sql += " ORDER BY score LIMIT ?"
    params.append(limite)
    cur = con.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def _buscar_medicamentos(con: sqlite3.Connection, query: str, contexto: str | None, limite: int) -> list[dict[str, Any]]:
    sql = """
        SELECT m.nome_display, m.contexto, m.fonte, m.calcula_por_peso, m.dados_json
        FROM medicamentos_fts f
        JOIN medicamentos m ON m.uid = f.uid
        WHERE medicamentos_fts MATCH ?
    """
    params: list[Any] = [query]
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


@tool("buscar_base_conhecimento_clinico")
def buscar_base_conhecimento_clinico(
    query: str,
    tipo: str = "ambos",
    categoria: str | None = None,
    contexto: str | None = None,
    limite: int = 8,
) -> str:
    """Busca na base de conhecimento clínico pessoal (protocolos, farmacologia,
    templates de documentação e base de prescrição/medicamentos).

    Use para: protocolos institucionais/pessoais por queixa ou diagnóstico,
    referências de farmacologia por classe, templates de evolução/SOAP/
    prescrição, e itens de medicamentos com dose/contexto (ambulatorial,
    hospitalar, pediátrico, diluição EV/BIC).

    Args:
        query: termos de busca em linguagem natural (ex.: "crise hipertensiva",
            "amoxicilina clavulanato pediátrico").
        tipo: "documento" (protocolos/farmacologia/templates), "medicamento"
            (base de prescrição) ou "ambos" (default).
        categoria: filtro opcional de categoria de documento (ex.:
            "protocolo_clinico", "farmacologia_classe").
        contexto: filtro opcional de contexto de medicamento (ex.:
            "ambulatorial_pediatrico", "diluicao_ev_bic").
        limite: número máximo de resultados por tipo (default 8).

    Returns:
        JSON com os documentos e/ou medicamentos encontrados. Documentos
        trazem titulo/categoria/arquivo_fonte/chunk_index/chunk_total/
        conteudo. Medicamentos trazem nome_display/contexto/fonte/dados —
        sempre reporte contexto e fonte, nunca misture itens de contextos
        diferentes como intercambiáveis.
    """
    if not os.path.exists(DB_PATH):
        return json.dumps({"erro": f"Base RAG não encontrada em {DB_PATH}. Confira knowledge/kb/."})

    con = sqlite3.connect(DB_PATH)
    try:
        resultado: dict[str, Any] = {}
        if tipo in ("documento", "ambos"):
            resultado["documentos"] = _buscar_documentos(con, query, categoria, limite)
        if tipo in ("medicamento", "ambos"):
            resultado["medicamentos"] = _buscar_medicamentos(con, query, contexto, limite)
    finally:
        con.close()

    return json.dumps(resultado, ensure_ascii=False)
