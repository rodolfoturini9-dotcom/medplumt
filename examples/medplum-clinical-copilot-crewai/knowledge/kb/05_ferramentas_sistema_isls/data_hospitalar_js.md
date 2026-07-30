# Base `data-hospitalar.js` — Prescrição de Internação/Prontuário

**Tamanho do arquivo:** ~272 KB
**Uso declarado no arquivo:** exclusivo do módulo Prontuário (internação), adultos e pediatria.

**Origem (conforme comentário do arquivo):**
`Painel_de_Admissao_Hospitalar.html` (adulto, texto livre) +
`Prontuario_de_admissao_Ped.html` (pediatria, calculável por peso).

## Três variáveis globais

### 1. `window.DATA_HOSPITALAR_ADULTO` — 364 itens
Array de strings já prontas para prescrição, ex.:
`"Dipirona 1 g EV 6/6h SN"`, `"Tramadol 100 mg + 250ml de SF EV 8/8h SN"`,
`"Fentanil adesivo transdérmico 25 mcg/h a cada 72h"`.
Cobre analgésicos, AINEs, opioides e, presumivelmente (dado o volume), demais classes usadas em
prescrição de enfermaria — texto literal sem cálculo.

### 2. `window.DATA_HOSPITALAR_PEDIATRIA` — 274 itens
Estrutura rica por item:
```json
{"id":"...", "principio_ativo":"...", "nome_comercial":["..."], "apresentacao":"...",
 "via":"...", "frequencia":"...", "condicao":"...",
 "dose_base":{"valor":..,"unidade":".."}, "formula_calculo":"...",
 "dose_maxima_dose":.., "dose_maxima_dia":..,
 "concentracao":{"valor":..,"unidade":".."},
 "conversao":{"tipo_saida":"jatos|mL|gotas|comprimidos",
   "gotas_por_ml":.., "jatos_por_dose":.., "volume_ampola_ml":..,
   "unidades_por_apresentacao":.., "fracao_comprimido_permitida":[..],
   "arredondamento":"inteiro|...", "min_saida":.., "max_saida":..},
 "texto_template":"... {dose_saida} ...", "observacoes":"..."}
```
Permite cálculo automático da dose de saída na unidade certa da apresentação (jatos, mL,
gotas, comprimidos), com regras de arredondamento e limites mín/máx por administração.

### 3. `window.DATA_HOSPITALAR_ADULTO_CALC` — 6 itens
Medicamentos adultos calculáveis por peso (mg/kg), ex.: Enoxaparina (1 mg/kg SC 12/12h ou
1,5 mg/kg SC 1x/dia), Vancomicina (15 mg/kg EV 12/12h), Amicacina, Gentamicina,
Dexmedetomidina. Estrutura: `{"nome","valorPorKg","unidade","via","frequencia","textoOriginal"}`.

## Ponto de atenção para o copiloto
- `DATA_HOSPITALAR_ADULTO` é texto fixo — não recalcular.
- `DATA_HOSPITALAR_PEDIATRIA` e `DATA_HOSPITALAR_ADULTO_CALC` dependem de peso do paciente para
  gerar a dose final — exigir peso informado antes de calcular; respeitar `dose_maxima_dose` e
  `dose_maxima_dia` quando presentes.
