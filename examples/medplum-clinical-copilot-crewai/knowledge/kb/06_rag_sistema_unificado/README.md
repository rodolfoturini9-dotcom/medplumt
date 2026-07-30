# Sistema RAG Unificado — Base de Conhecimento + Base de Prescrição

Este módulo consolida **todo** o conteúdo anterior (protocolos clínicos, farmacologia,
templates de documentação, documentação das ferramentas do Sistema ISLS) e **todas** as bases
de prescrição (ambulatorial, hospitalar, pediátrica, diluições/BIC) em uma única camada de
consulta rápida, pronta para uso por um agente de IA (RAG) ou por qualquer sistema clínico
próprio (via SQLite ou JS puro, sem servidor).

## Por que dois formatos de índice (SQLite + JSON)?

| Cenário de uso | Arquivo a usar |
|---|---|
| Agente de IA com acesso a shell/Python (Claude Code, script local, backend) | `rag_isls.sqlite` + `consultar_rag.py` |
| App HTML/JS client-side (ex.: os próprios apps do Sistema ISLS, uso offline no navegador) | `isls_rag_search.js` + `indice_invertido_documentos.json` / `indice_invertido_medicamentos.json` |
| Ingestão em outra plataforma de RAG (embeddings, vector DB) | `corpus.jsonl` (um chunk por linha, já com metadados) |
| Sincronização/atualização de bases de prescrição por código | `medicamentos_unificado.json` |

Ambos os índices são gerados **a partir dos mesmos dados-fonte** (arquivos das pastas
`01`–`05`); não há divergência de conteúdo entre eles.

## Arquivos deste módulo

- **`rag_isls.sqlite`** — banco único com:
  - tabela `documentos` (847 chunks de protocolos/farmacologia/templates/ferramentas) +
    `documentos_fts` (índice full-text FTS5, ranking BM25, normalização sem acento);
  - tabela `medicamentos` (2.779 itens de todas as bases de prescrição, com contexto e fonte
    de origem preservados) + `medicamentos_fts` (busca full-text por nome/indicação/texto).
  - Consultas testadas em **< 1 ms** por busca (BM25), mesmo com o corpus completo.
- **`consultar_rag.py`** — CLI Python (só biblioteca padrão) para consulta direta:
  ```bash
  python3 consultar_rag.py "crise hipertensiva"
  python3 consultar_rag.py --tipo medicamento "amoxicilina clavulanato"
  python3 consultar_rag.py --tipo documento --categoria farmacologia_classe --json "corticoide"
  ```
- **`corpus.jsonl`** — 847 chunks (protocolos + farmacologia + templates + docs de ferramentas),
  um JSON por linha: `{id, titulo, categoria, subpasta, arquivo_fonte, chunk_index, chunk_total,
  conteudo, n_chars}`. Formato padrão para ingestão em qualquer pipeline de embeddings/vector DB.
- **`medicamentos_unificado.json`** — 2.779 itens de **todas** as bases de prescrição em um
  único array, cada item com os campos originais **preservados** mais 4 campos de controle:
  `_uid`, `_contexto` (ex.: `ambulatorial_pediatrico`, `hospitalar_pediatrico_calculavel`,
  `diluicao_ev_bic`), `_fonte` (arquivo/variável de origem) e `_nome_normalizado` (para
  deduplicação/cruzamento).
- **`indice_invertido_documentos.json`** / **`indice_invertido_medicamentos.json`** — índices
  invertidos (token → {id: frequência}) com metadados compactos, para busca TF-IDF em
  JavaScript puro, sem nenhuma dependência externa nem backend.
- **`isls_rag_search.js`** — motor de busca client-side (`window.ISLS_RAG`) para uso direto
  dentro dos apps HTML do Sistema ISLS.
- **`relatorio_conflitos_pediatricos.json`** — resultado da checagem automática de
  cruzamento por nome normalizado entre as bases pediátricas de fontes distintas.

## Resultado da checagem de duplicidade/conflito entre bases pediátricas

A unificação verificou se o **mesmo nome normalizado** aparece em mais de uma *fonte* distinta
entre `data-ambulatorio.js` (itens pediátricos), `DATA_HOSPITALAR_PEDIATRIA`,
`data-ped-rodolfo.js` e `data-ped-prontuario.js`.

**Resultado: nenhuma coincidência exata de nome normalizado entre fontes distintas foi
encontrada** (`relatorio_conflitos_pediatricos.json` = lista vazia). Isso quer dizer uma das
duas coisas — e a checagem automática não permite distinguir qual:
1. as bases realmente cobrem itens diferentes (nomes comerciais distintos, apresentações
   diferentes do mesmo princípio ativo), **ou**
2. o mesmo princípio ativo existe em mais de uma base, mas com nomenclatura textual diferente
   o suficiente (ex.: nome comercial vs. nome genérico, abreviações) para não ser capturado por
   correspondência exata de string.

**Conclusão prática:** a suposição anterior de "o mesmo fármaco aparece em até 4 bases" não foi
confirmada por correspondência exata — trate como hipótese não verificada, não como fato. Uma
checagem por princípio ativo (não por nome de string) exigiria um dicionário de sinônimos
marca↔genérico, que não foi construído nesta consolidação.

## Como um agente de IA deve usar este módulo

1. **Para perguntas clínicas/protocolo:** consultar `documentos_fts` (via `consultar_rag.py
   --tipo documento` ou o SQL diretamente) com os termos da pergunta; usar os `chunk_index`/
   `chunk_total` para saber se o trecho retornado é parcial e buscar chunks vizinhos do mesmo
   `arquivo_fonte`, se necessário.
2. **Para prescrição/dose:** consultar `medicamentos_fts`, sempre reportando `contexto` e
   `fonte` junto do resultado (ex.: "esta posologia vem da base hospitalar pediátrica
   calculável"), nunca misturando itens de contextos diferentes como se fossem intercambiáveis.
3. **Nunca** calcular dose por peso/idade sem que o dado esteja disponível — os campos de
   fórmula (`formulas`, `formula_calculo`, `js`, `valorPorKg`) devem ser aplicados exatamente
   como estão definidos na fonte, sem simplificação.
4. Ao citar conteúdo de `01_protocolos_clinicos`/`02_farmacologia`, mencionar que é protocolo
   institucional/base pessoal, não diretriz externa — mesma regra já vigente no restante da base.

## Como um sistema clínico (app HTML/JS) deve usar este módulo

```html
<script src="isls_rag_search.js"></script>
<script>
  (async () => {
    const docsIdx = await ISLS_RAG.load('./indice_invertido_documentos.json');
    const medsIdx = await ISLS_RAG.load('./indice_invertido_medicamentos.json');

    const protocolos = docsIdx.buscar('cetoacidose diabética insulina', 5);
    const medicamentos = medsIdx.buscar('dipirona gotas pediatrico', 5);
  })();
</script>
```
Nenhuma dependência externa, nenhum servidor — funciona em `file://` ou em qualquer hospedagem
estática, mantendo a filosofia offline-first dos demais apps do Sistema ISLS.

## Manutenção / regeneração

Caso as pastas `01`–`05` ou os arquivos-fonte JS/HTML do Sistema ISLS sejam atualizados, este
módulo (SQLite + índices + JSONL) precisa ser **regenerado** — ele é um artefato derivado, não
deve ser editado manualmente. Solicite a regeneração informando quais arquivos-fonte mudaram.
