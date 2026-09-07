# Bases Pediátricas Complementares

## `data-ped-rodolfo.js` — 102 itens
**Variável global:** `window.DATA_PED_RODOLFO`
**Origem:** curada pelo próprio Rodolfo — "posologias corrigidas: verbo + rota + intervalo em
formato de impressão", segundo comentário do arquivo.

Estrutura por item:
```json
{"id":"rodolfo_ped_0001","t":"p","nome":"...", "qt":"...",
 "posologiaTemplate":"Tomar ... mL VO 12/12h por 10 dias.",
 "classe":"Base pediátrica — Rodolfo",
 "formulas":[{"indication":"...","type":"per_kg","dosePerKg":0.28,"doseUnit":"mL",
   "maxDose":11.3,"maxUnit":"mL","template":"..."}],
 "label":"NOME — PEDIÁTRICO (calcula por peso) [Rodolfo]"}
```
Mesmo padrão de cálculo por peso da base ambulatorial pediátrica, mas com curadoria adicional
identificada pelo sufixo `[Rodolfo]` no rótulo — sinaliza que é a versão de referência quando
houver conflito com outras bases pediátricas do sistema.

## `data-ped-prontuario.js` — 142 fórmulas
**Variável global:** `window.DATA_PED_PRONTUARIO`
**Origem:** portada da planilha "Prontuário Google Sheets ISLS" (aba "Base medicamentos").

Estrutura por item — cada fórmula é uma **expressão JavaScript em string**, já traduzida do
Excel original:
```json
{"rotulo":"Dipirona 500mg/mL gts — gts VO 6/6h SN",
 "js":"\"Dipirona 500mg/mL gts – \"+br(Math.min(r(0.6*p,0),40))+\" gts VO 6/6h SN\""}
```
Convenções (conforme comentário do arquivo):
- `p` = peso em kg
- `r(x,n)` = arredondamento para `n` casas decimais
- `br(x)` = formata número com vírgula decimal (padrão brasileiro)
- `IFF` = condicional (equivalente a `SE` do Excel), quando presente na fórmula

Essas expressões são destinadas a ser avaliadas (`eval`/`Function`) pelo aplicativo consumidor
com `p` substituído pelo peso do paciente — **não devem ser executadas ou interpretadas
manualmente pelo agente de IA sem repetir exatamente a lógica matemática nelas descrita**, para
evitar erro de cálculo de dose.

## Ponto de atenção para o copiloto
- Havendo o mesmo princípio ativo em `data-ped-rodolfo.js`, `data-ped-prontuario.js`,
  `data-ambulatorio.js` (itens `t:p`) e `DATA_HOSPITALAR_PEDIATRIA`, **não presumir
  equivalência automática** — apresentação, concentração e contexto de uso (ambulatório vs.
  internação vs. prontuário rápido) podem diferir. Confirmar com o usuário qual base é a
  pertinente ao contexto antes de gerar a prescrição.
