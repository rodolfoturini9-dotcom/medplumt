/* ============================================================
   Sistema ISLS — Impressão
   ------------------------------------------------------------
   A5 ambulatorial: medidas e classes reproduzidas exatamente do
   arquivo "Templates impressão A5 ambulatório.html" fornecido
   (margens 45/13/25/13 mm; 50 mm inferiores no controle especial).

   Prontuário hospitalar: grade de 4 colunas reproduzindo o
   impresso do ISLS (Prescrição | Horário | Sinais Vitais |
   Evolução), A4 paisagem. Nada é impresso no topo: os 2,553 cm
   superiores ficam em branco porque o papel já é timbrado.
   ============================================================ */
window.ISLS_PRINT = (function () {
  var cfg = window.ISLS_CONFIG || {};

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function txt(v) { return String(v == null ? '' : v).trim(); }
  function nl2br(v) { return esc(v).replace(/\n/g, '<br>'); }

  function dataPtBr(iso) {
    var d = iso ? new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')) : new Date();
    if (isNaN(d)) d = new Date();
    var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return 'Ivaiporã, ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear() + '.';
  }

  /* ---------------- CSS A5 — cópia fiel do template fornecido ---------------- */
  var CSS_A5 = `
    :root {
      --page-w: 148mm;
      --page-h: 210mm;
      --margin-top: 45mm;
      --margin-right: 13mm;
      --margin-bottom: 25mm;
      --margin-left: 13mm;
      --content-w: calc(var(--page-w) - var(--margin-left) - var(--margin-right));
      --content-h: calc(var(--page-h) - var(--margin-top) - var(--margin-bottom));
      --font-main: Arial, Helvetica, sans-serif;
    }
    @page { size: A5 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0; background: #fff; color: #000;
      font-family: var(--font-main);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .print-page {
      position: relative; width: var(--page-w); height: var(--page-h);
      page-break-after: always; overflow: hidden; background: #fff;
    }
    .content-area {
      position: absolute; top: var(--margin-top); left: var(--margin-left);
      width: var(--content-w); height: var(--content-h);
    }
    .margin-50 .content-area { height: calc(var(--page-h) - var(--margin-top) - 50mm); }
    .doc-title { text-align: center; font-size: 13pt; font-weight: 700; margin: 0 0 6mm 0; line-height: 1.2; }
    .print-patient {
      font-size: 11pt; font-weight: 700; text-transform: uppercase; line-height: 1.2;
      margin: 0; padding-right: 42mm; word-break: break-word;
    }
    .divider { height: 0.6mm; background: #000; margin: 3mm 0 6mm 0; }
    .body-free { position: relative; width: 100%; font-size: 10pt; line-height: 1.35; white-space: normal; word-break: break-word; }
    .date-bottom { position: absolute; left: 0; bottom: 0; font-size: 9pt; line-height: 1.2; }
    .exam-list, .cert-body, .items-block { font-size: 10pt; line-height: 1.35; word-break: break-word; }
    .items-block { white-space: normal; }
    .prescription-list { width: 100%; }
    .rx-item { margin: 0 0 8mm 0; }
    .rx-item:last-child { margin-bottom: 0; }
    .rx-head { font-size: 11.5pt; line-height: 1.28; margin: 0 0 1.8mm 0; }
    .rx-number { font-weight: 400; margin-right: 1.2mm; }
    .rx-name { font-weight: 400; }
    .rx-line { margin-left: 0mm; font-size: 11pt; line-height: 1.25; }
    .rx-sig { margin: 1.2mm 0 0 6.5mm; font-size: 10.8pt; line-height: 1.28; }
    .exam-list > div { margin-bottom: 1.5mm; }
    .cid-line { margin-top: 6mm; font-size: 10pt; font-weight: 700; line-height: 1.25; }
    .via-tag { position: absolute; right: 0; top: 0; font-size: 8pt; font-weight: 700; letter-spacing: .06em; }
    .letterhead { position: absolute; top: 8mm; left: var(--margin-left); width: var(--content-w); }
    .letterhead img { width: 100%; display: block; }
    @media screen {
      body { background: #dcdcdc; }
      .print-page { margin: 0 auto 8mm auto; box-shadow: 0 0 0.8mm rgba(0,0,0,0.18); }
    }
    @media print { .print-page { margin: 0; box-shadow: none; } }
  `;

  function letterhead() {
    if (!cfg.CABECALHO_NA_IMPRESSAO) return '';
    return '<div class="letterhead"><img src="assets/cabecalho-isls.png" alt=""></div>';
  }

  /* ---------------- itens de prescrição (regra do template: máx. 5) ---------------- */
  function renderPrescricao(itens) {
    if (!Array.isArray(itens) || !itens.length) return '';
    return itens.slice(0, 5).map(function (item, i) {
      var nome = txt(item.nome), qtd = txt(item.quantidade), sig = txt(item.posologia);
      if (!nome && !qtd && !sig) return '';
      return '<div class="rx-item">' +
        '<div class="rx-line">' +
          '<span class="rx-number">' + (i + 1) + '.</span> ' +
          '<span class="rx-name">' + esc(nome) + '</span>' + (qtd ? ' ' + esc(qtd) : '') +
        '</div>' +
        (sig ? '<div class="rx-sig">' + esc(sig) + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function paginaA5(id, classe, corpoHtml, paciente, data, viaTag) {
    return '<section class="print-page ' + classe + '" id="' + id + '">' +
      letterhead() +
      '<div class="content-area">' +
        (viaTag ? '<div class="via-tag">' + esc(viaTag) + '</div>' : '') +
        '<div class="print-patient">PACIENTE: ' + esc(paciente) + '</div>' +
        '<div class="divider"></div>' +
        corpoHtml +
        '<div class="date-bottom">' + esc(data) + '</div>' +
      '</div>' +
    '</section>';
  }

  function abrir(titulo, css, corpo, varsScript) {
    var w = window.open('', '_blank');
    if (!w) { alert('O navegador bloqueou a janela de impressão. Libere os pop-ups deste endereço.'); return; }
    var varsBlock = varsScript ? ('var html=document.documentElement;' + varsScript) : '';
    w.document.write('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
      '<title>' + esc(titulo) + '</title><base href="' + location.href.replace(/[^/]*$/, '') + '">' +
      '<style>' + css + '</style></head><body>' + corpo +
      '<script>' + varsBlock + 'window.onload=function(){setTimeout(function(){window.print();},350);};<\/script>' +
      '</body></html>');
    w.document.close();
  }

  /* ---------------- documentos ambulatoriais ---------------- */
  function receita(doc) {
    var data = dataPtBr(doc.data);
    var corpo = '<div class="body-free items-block prescription-list">' + renderPrescricao(doc.itens) + '</div>';
    var html;
    if (doc.controleEspecial) {
      html = paginaA5('page-receita-2vias-1', 'margin-50', corpo, doc.paciente, data, '1ª VIA — FARMÁCIA') +
             paginaA5('page-receita-2vias-2', 'margin-50', corpo, doc.paciente, data, '2ª VIA — PACIENTE');
    } else {
      html = paginaA5('page-receita-simples', '', corpo, doc.paciente, data, '');
    }
    abrir('Receita — ' + doc.paciente, CSS_A5, html);
  }

  function exames(doc) {
    var lista = (doc.exames || []).filter(function (e) { return txt(e); })
      .map(function (e) { return '<div>' + esc(txt(e)) + '</div>'; }).join('');
    var corpo = '<div class="body-free exam-list">' + lista + '</div>';
    abrir('Pedido de exames — ' + doc.paciente,
      CSS_A5, paginaA5('page-exames', '', corpo, doc.paciente, dataPtBr(doc.data), ''));
  }

  function atestado(doc) {
    var corpo = '<div class="body-free cert-body">' + nl2br(doc.texto) + '</div>' +
      (txt(doc.cid) ? '<div class="cid-line">CID: ' + esc(txt(doc.cid)) + '</div>' : '');
    abrir('Atestado — ' + doc.paciente,
      CSS_A5, paginaA5('page-atestado', '', corpo, doc.paciente, dataPtBr(doc.data), ''));
  }

  /* ---------------- prontuário hospitalar (A4 paisagem) ----------------
     Dimensões exatas fornecidas pelo usuário (planilha de referência):
       Coluna A (Prescrição Médica):        245 pt
       Coluna B (Horário dos Medicamentos):  163 pt
       Colunas C, D, E, F (H, PA, T, FC):     43 pt cada
       Coluna G (Evolução Médica):           253 pt
       Total: 245+163+43*4+253 = 833 pt
       25 linhas (3 de cabeçalho + 22 de dados), 19 pt cada = 475 pt
     Isso cabe em uma única página A4 paisagem (841,68 x 595,32 pt)
     com margens mínimas — sem quebra de página. ---------------- */
  /* Margens do impresso (referência: modelo de impressão fornecido):
       Início (topo, área do timbrado do papel — deixada em branco): 2,553 cm
       Esquerda / Direita:              0,51 cm
       Fim (rodapé):                    0 cm
     Largura útil A4 paisagem: 297 − 2×5,1 = 286,8 mm.
     Proporções das colunas mantidas da planilha (245/163/43×4/253 pt). */
  var MARGEM_TOPO_MM = 25.53, MARGEM_LADO_MM = 5.1;
  var LARG_UTIL_MM = 297 - (2 * MARGEM_LADO_MM); // 286,8 mm
  var PROP_TOTAL = 245 + 163 + (43 * 4) + 253;   // 833
  function colMM(pt) { return Math.round((LARG_UTIL_MM * pt / PROP_TOTAL) * 100) / 100; }
  var COL_A = colMM(245), COL_B = colMM(163), COL_VIT = colMM(43), COL_G = colMM(253); // mm
  var ALTURA_LINHA = 6.7; // mm (≈19 pt)
  var LINHAS_DADOS = 22;

  var CSS_PRONT = `
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin:0; padding:0; background:#fff; color:#000;
      font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; }
    .folha { position: relative; width: 297mm; min-height: 210mm; }
    .area-grade { position: absolute; top: ${MARGEM_TOPO_MM}mm; left: ${MARGEM_LADO_MM}mm;
      width: ${LARG_UTIL_MM}mm; }
    table.prontuario { border-collapse: collapse; table-layout: fixed; width: ${LARG_UTIL_MM}mm; }
    .prontuario td { border: 1px solid #000; height: ${ALTURA_LINHA}mm; min-height: ${ALTURA_LINHA}mm;
      max-height: ${ALTURA_LINHA}mm; padding: 0.4mm 1mm; vertical-align: middle; overflow: hidden;
      line-height: 1.05; font-size: 8pt; }
    .bold { font-weight: 700; }
    .center { text-align: center; }
    .rx { font-size: var(--rx-font-size, 8pt); white-space: pre-wrap; overflow-wrap: break-word; }
    .evolucao-area { font-size: var(--evolucao-font-size, 8pt); white-space: pre-wrap;
      overflow-wrap: break-word; vertical-align: top !important; padding-top: 0.7mm !important; height: auto; max-height: none; }
    .linha-sinais-fixa { text-align: left; }
    .linha-sinais-com-barra { display:flex; justify-content: space-between; align-items:center; width:100%; }
  `;

  function prontuario(p) {
    var LINHAS = LINHAS_DADOS;
    var rx = (p.prescricao || '').split('\n');
    var horarios = (p.horarios || '').split('\n');
    var ev = nl2br(p.evolucao || '');
    var rxFont = limitarFonte(p.rxFontSize);
    var evFont = limitarFonte(p.evolucaoFontSize);

    var horas = (p.vitais && p.vitais.length) ? p.vitais : [
      { h: '10' }, { h: '16' }, { h: '22' }, { h: '04' }
    ];

    var linhasHtml = '';
    var idx = 0;

    function celulasPrescricaoHorario() {
      return '<td class="rx">' + esc(rx[idx] || '') + '</td>' +
        '<td class="rx center">' + esc(horarios[idx] || '') + '</td>';
    }

    linhasHtml += '<tr>' +
      celulasPrescricaoHorario() +
      '<td colspan="2" class="bold">Hora da admissão:</td>' +
      '<td colspan="2" class="bold center">' + esc(p.horaAdmissao || '') + '</td>' +
      '<td rowspan="' + LINHAS + '" class="evolucao-area">' + ev + '</td>' +
    '</tr>';
    idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold">Idade: ' + esc(p.idade ? p.idade + ' anos' : '') + '</td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="2" class="bold">Peso: ' + esc(p.peso ? p.peso + ' kg' : '') + '</td><td colspan="2" class="bold">Altura: ' + esc(p.altura ? p.altura + ' m' : '') + '</td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold">IMC: ' + esc(p.imc || '') + '</td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td class="bold center">H</td><td class="bold center">PA</td><td class="bold center">T</td><td class="bold center">FC</td></tr>'; idx++;
    for (var hIdx = 0; hIdx < 4; hIdx++) {
      var v = horas[hIdx] || {};
      linhasHtml += '<tr>' + celulasPrescricaoHorario() +
        '<td class="bold center">' + esc(v.h || '') + '</td><td>' + esc(v.pa || '') + '</td><td>' + esc(v.t || '') + '</td><td>' + esc(v.fc || '') + '</td></tr>';
      idx++;
    }
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>'; idx++;
    var satO2Campos = txt(p.sato2).split(/[;,|/]+/).map(function (v) { return txt(v); }).slice(0, 3);
    while (satO2Campos.length < 3) satO2Campos.push('');
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td class="bold linha-sinais-fixa">SatO2:</td>' +
      '<td class="center">' + esc(satO2Campos[0]) + '</td><td class="center">' + esc(satO2Campos[1]) + '</td><td class="center">' + esc(satO2Campos[2]) + '</td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold linha-sinais-fixa"><span class="linha-sinais-com-barra"><span>Dieta:</span><span>' + esc(p.dieta || '/') + '</span></span></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold linha-sinais-fixa"><span class="linha-sinais-com-barra"><span>Diurese:</span><span>' + esc(p.diurese || '/') + '</span></span></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold linha-sinais-fixa"><span class="linha-sinais-com-barra"><span>Evacuação:</span><span>' + esc(p.evacuacao || '/') + '</span></span></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold linha-sinais-fixa"><span class="linha-sinais-com-barra"><span>Vômito:</span><span>' + esc(p.vomito || '/') + '</span></span></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>'; idx++;
    linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="bold linha-sinais-fixa"><span class="linha-sinais-com-barra"><span>Dreno:</span><span>' + esc(p.dreno || '/') + '</span></span></td></tr>'; idx++;
    while (idx < LINHAS) {
      linhasHtml += '<tr>' + celulasPrescricaoHorario() + '<td colspan="4" class="linha-sinais-fixa"></td></tr>';
      idx++;
    }

    // O prontuário é impresso em papel já timbrado da instituição.
    // Nada é impresso no topo: apenas o espaço de 2,553 cm é reservado
    // pelo posicionamento da .area-grade, alinhando a grade ao papel.
    var topo = '';

    var diaExtenso = p.dataExtenso || dataPtBrCompleta(p.data);

    var grade = '<table class="prontuario" aria-label="Prontuário padrão fixo">' +
      '<colgroup>' +
        '<col style="width:' + COL_A + 'mm">' +
        '<col style="width:' + COL_B + 'mm">' +
        '<col style="width:' + COL_VIT + 'mm">' +
        '<col style="width:' + COL_VIT + 'mm">' +
        '<col style="width:' + COL_VIT + 'mm">' +
        '<col style="width:' + COL_VIT + 'mm">' +
        '<col style="width:' + COL_G + 'mm">' +
      '</colgroup>' +
      '<tr>' +
        '<td colspan="2" class="bold">Paciente: ' + esc(p.paciente || '') + '</td>' +
        '<td colspan="4" class="bold">Quarto: ' + esc(p.quarto || '') + '</td>' +
        '<td class="bold">Diagnostico: ' + esc(p.diagnostico || '') + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td class="bold center">' + esc(diaExtenso) + '</td>' +
        '<td class="bold">Categoria: ' + esc(p.categoria || '') + '</td>' +
        '<td colspan="4" class="bold">Leito: ' + esc(p.leito || '') + '</td>' +
        '<td class="bold">Médico: ' + esc(p.medico || '') + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td class="bold center">Prescrição Médica</td>' +
        '<td class="bold center">Horário dos Medicamentos</td>' +
        '<td colspan="4" class="bold center">Sinais Vitais</td>' +
        '<td class="bold center">Evolução Médica</td>' +
      '</tr>' +
      linhasHtml +
    '</table>';

    var corpo = '<div class="folha">' + topo + '<div class="area-grade">' + grade + '</div></div>';

    var vars = 'html.style.setProperty("--rx-font-size","' + rxFont + 'pt");' +
                'html.style.setProperty("--evolucao-font-size","' + evFont + 'pt");';
    abrir('Prontuário — ' + (p.paciente || ''), CSS_PRONT, corpo, vars);
  }

  function limitarFonte(v) {
    v = Number(v);
    if (!v || isNaN(v)) v = 11;
    return Math.max(6, Math.min(16, v));
  }

  function dataPtBrCompleta(iso) {
    var d = iso ? new Date(iso + 'T12:00:00') : new Date();
    if (isNaN(d)) d = new Date();
    var dias = ['Domingo','Segunda-Feira','Terça-Feira','Quarta-Feira','Quinta-Feira','Sexta-Feira','Sábado'];
    var meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return dias[d.getDay()] + ', ' + d.getDate() + ' De ' + meses[d.getMonth()] + ' De ' + d.getFullYear();
  }

  return {
    receita: receita,
    exames: exames,
    atestado: atestado,
    prontuario: prontuario,
    dataPtBr: dataPtBr
  };
})();
