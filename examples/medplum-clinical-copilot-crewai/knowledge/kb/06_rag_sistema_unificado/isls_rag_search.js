/* ============================================================
   ISLS RAG Search — motor de busca client-side (sem backend)
   ------------------------------------------------------------
   Usa os índices invertidos pré-computados:
     - indice_invertido_documentos.json   (protocolos, farmacologia,
       templates, documentação das ferramentas)
     - indice_invertido_medicamentos.json (base unificada de
       prescrição: ambulatorial, hospitalar, pediátrica, diluições)

   Pontuação: TF-IDF simplificado (log(1+freq) * idf), sem dependências
   externas. Adequado para uso dentro de qualquer app HTML/JS do
   Sistema ISLS (basta incluir este arquivo e os dois JSON de índice).

   Uso básico:
     const rag = await ISLS_RAG.load('./indice_invertido_documentos.json');
     const resultados = rag.buscar('crise hipertensiva urgência', 5);
     // resultados: [{id, score, ...meta}]
   ============================================================ */
window.ISLS_RAG = (function () {

  function tokenize(text) {
    text = String(text || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (text.match(/[a-z0-9]{3,}/g) || []);
  }

  async function load(indexUrl) {
    const resp = await fetch(indexUrl);
    if (!resp.ok) throw new Error('Falha ao carregar índice: ' + indexUrl);
    const data = await resp.json();
    const index = data.index;   // token -> {id: freq}
    const meta = data.meta;     // id -> metadados
    const totalDocs = Object.keys(meta).length;

    // idf pré-computado por token
    const idf = {};
    for (const tok in index) {
      const df = Object.keys(index[tok]).length;
      idf[tok] = Math.log(1 + totalDocs / df);
    }

    function buscar(query, limite) {
      limite = limite || 10;
      const tokens = tokenize(query);
      const scores = {};
      for (const tok of tokens) {
        const postings = index[tok];
        if (!postings) continue;
        const w = idf[tok] || 0;
        for (const id in postings) {
          const freq = postings[id];
          scores[id] = (scores[id] || 0) + Math.log(1 + freq) * w;
        }
      }
      const ranked = Object.keys(scores)
        .map(id => ({ id, score: scores[id], ...meta[id] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limite);
      return ranked;
    }

    return { buscar, index, meta, totalDocs };
  }

  return { load, tokenize };
})();
