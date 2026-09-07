# Sistema ISLS — Visão Geral

Conjunto de módulos HTML/JS desenvolvidos para uso pessoal em prática clínica (ambulatório,
internação/enfermaria e emergência), cobrindo geração de documentos impressos, cálculo de
diluições/BIC e bases de dados de prescrição (adulto e pediátrica). Os módulos compartilham
dados via objetos globais `window.*` e uma camada de configuração (`window.ISLS_CONFIG`).

## Módulos identificados

| Arquivo | Função | Itens/registros |
|---|---|---|
| `impressao.js` | Motor de impressão (receita A5, pedido de exames A5, atestado A5, prontuário de internação A4 paisagem) | — |
| `data-ambulatorio.js` | Base de prescrição ambulatorial (adulto + pediátrica com fórmulas por peso/idade) | 1.644 itens adulto + 161 pediátricos = 1.805 |
| `data-hospitalar.js` | Base de prescrição para o módulo Prontuário/Internação (texto livre + calculável) | 364 (adulto texto livre) + 274 (pediatria estruturada) + 6 (adulto por kg, ex. enoxaparina/vancomicina) |
| `data-ped-rodolfo.js` | Base pediátrica adicional, curada por Rodolfo, com fórmulas de cálculo por peso e templates de posologia | 102 itens |
| `data-ped-prontuario.js` | Base pediátrica "rápida" do módulo Prontuário, portada de planilha Google Sheets com fórmulas JS geradas a partir do Excel original | 142 fórmulas |
| `Diluic_o_es.html` | Aplicativo standalone completo (calculadora de diluição/BIC EV, com ajuste renal) | 85 medicamentos, 3 categorias |
| `data-exames.js` | Base de autocomplete para pedido de exames | ~90 itens fixos + customizados em runtime |

## Arquitetura comum
- Dados carregados como arrays/objetos JS globais (`window.DATA_*`), permitindo que os módulos
  de UI (não incluídos neste anexo) os consumam via autocomplete/busca.
- Convenção de campos por base (ver arquivos individuais abaixo).
- `impressao.js` é o único módulo de renderização/impressão comum a receitas, exames, atestados
  e ao prontuário de internação — mantém fielmente medidas de margem e proporções de coluna
  fornecidas pelo usuário (não deve ser alterado sem instrução explícita, conforme já registrado
  no próprio código-fonte).

## Observações de auditoria já registradas no próprio código
- `data-ambulatorio.js`: base adulta já "auditada" (150 itens corrompidos com `#REF!` removidos
  previamente). Base pediátrica foi **substituída** por fonte corrigida após identificação de
  erro sistemático de dose máxima (~metade do valor correto) em vários itens da base pediátrica
  anterior (exemplo citado no próprio arquivo: Dipirona Gotas 500 mg/mL — máximo antigo 20
  gotas, correto 40 gotas).
- `Diluic_o_es.html`: título do próprio arquivo indica "v2.0 Auditoria", sugerindo revisão prévia
  das diluições/doses.

## Pontos de atenção para uso como copiloto clínico
1. Estas bases contêm **dados de prescrição operacional** (textos prontos, fórmulas de cálculo
   por peso/idade, diluições e ajustes renais) — são material de apoio à ferramenta de
   prescrição, não protocolos clínicos com fundamentação/referências bibliográficas (diferença
   em relação às pastas `01_protocolos_clinicos` e `02_farmacologia`).
2. Ao usar estes dados para sugerir uma prescrição, o agente deve tratá-los como *conteúdo
   operacional já validado por Rodolfo em revisões anteriores*, mas ainda assim aplicar as
   mesmas regras de fidelidade a dados (não calcular dose por peso sem peso informado, respeitar
   dose máxima, não presumir função renal).
3. Há duplicidade proposital entre bases (ex.: pediatria aparece em `data-ambulatorio.js`,
   `data-hospitalar.js` [`DATA_HOSPITALAR_PEDIATRIA`], `data-ped-rodolfo.js` e
   `data-ped-prontuario.js`) — cada uma serve um módulo/contexto de uso diferente (ambulatório
   vs. internação vs. prontuário rápido). Não devem ser fundidas sem confirmação, pois podem ter
   fórmulas/apresentações distintas para o mesmo princípio ativo.
