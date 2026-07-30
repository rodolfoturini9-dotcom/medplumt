# Módulo `impressao.js` — Motor de Impressão

**Arquivo original:** `impressao.js` (331 linhas)
**Namespace exposto:** `window.ISLS_PRINT` com métodos `receita`, `exames`, `atestado`,
`prontuario`, `dataPtBr`.

## Função
Gera e abre (`window.open`) uma janela HTML autônoma, já com CSS de impressão embutido, para
4 tipos de documento, disparando `window.print()` automaticamente após carregamento (delay de
350 ms).

## Documentos suportados

### 1. Receita (`receita(doc)`)
- Formato A5 retrato (148×210 mm), margens 45/13/25/13 mm (topo/direita/baixo/esquerda).
- Cabeçalho opcional (`window.ISLS_CONFIG.CABECALHO_NA_IMPRESSAO`) via imagem
  `assets/cabecalho-isls.png`.
- Lista até 5 itens de prescrição (`doc.itens`, campos `nome`, `quantidade`, `posologia`).
- Suporte a **receituário de controle especial em 2 vias** (`doc.controleEspecial`), com margem
  inferior estendida (50 mm) e marca "1ª VIA — FARMÁCIA" / "2ª VIA — PACIENTE".

### 2. Pedido de exames (`exames(doc)`)
- Mesmo formato A5, lista simples de exames (`doc.exames`), uma linha por item.

### 3. Atestado (`atestado(doc)`)
- A5, corpo de texto livre (`doc.texto`, com quebras de linha convertidas em `<br>`) e linha de
  CID opcional (`doc.cid`).

### 4. Prontuário de internação (`prontuario(p)`)
- **A4 paisagem**, grade fixa de 7 colunas reproduzindo o impresso físico do ISLS:
  Prescrição (245 pt) | Horário (163 pt) | H/PA/T/FC (43 pt cada) | Evolução (253 pt).
- Margem superior de 25,53 mm deixada em branco (papel já timbrado da instituição); margens
  laterais de 5,1 mm.
- 22 linhas de dados + 3 de cabeçalho; célula de evolução com `rowspan` cobrindo todas as linhas.
- Preenche automaticamente: paciente, quarto, diagnóstico, categoria, leito, médico, data por
  extenso (dia da semana), hora de admissão, idade, peso, altura, IMC, sinais vitais em até 4
  horários (H/PA/T/FC), SatO2 (até 3 valores), dieta, diurese, evacuação, vômito, dreno.
- Tamanho de fonte de prescrição e evolução ajustável (`rxFontSize`, `evolucaoFontSize`),
  limitado entre 6 e 16 pt (`limitarFonte`).
- Campos de prescrição/horário são preenchidos linha a linha a partir de texto multilinha
  (`p.prescricao`, `p.horarios` — split por `\n`).

## Funções utilitárias
- `esc()` — escapa HTML (proteção básica contra quebra de layout/XSS ao inserir texto livre).
- `dataPtBr(iso)` / `dataPtBrCompleta(iso)` — formata data por extenso em português
  ("Ivaiporã, 30 de julho de 2026." / "Quinta-Feira, 30 De Julho De 2026").
- `abrir(titulo, css, corpo, varsScript)` — abre nova janela, monta HTML completo e dispara
  impressão; trata bloqueio de pop-up com alerta ao usuário.

## Observações
- O comentário no topo do arquivo é explícito: as medidas do A5 e do prontuário A4 devem
  **reproduzir exatamente** um template de referência fornecido pelo usuário — não devem ser
  alteradas sem instrução, conforme a preferência geral de preservação de templates.
- Cidade fixa no rodapé da data: "Ivaiporã" (hardcoded em `dataPtBr`).
