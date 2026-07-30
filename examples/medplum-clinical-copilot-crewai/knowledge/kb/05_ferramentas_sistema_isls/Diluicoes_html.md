# `Diluic_o_es.html` — Gerador de Prescrições EV/BIC (v2.0 Auditoria)

Aplicativo standalone (HTML+CSS+JS em arquivo único, ~45 KB), com interface completa (não
apenas base de dados) para busca, diluição e cálculo de taxa de infusão de medicamentos
intravenosos, com ajuste por função renal.

## Dados internos

### `medicamentos` — 85 itens, 3 categorias (`Antibióticos`, `Vasoativos e Sedação`, `Outros`)
Estrutura por item:
```json
{"cat":"...", "nome":"...", "prescricao":"texto pronto de diluição/via/tempo de infusão",
 "calcPeso": true|false,
 // se calcPeso = true:
 "unidade":"mcg/kg/min | mcg/kg/h", "doseMin":.., "doseMax":..,
 "concentracao":.., "unidadeConc":"mcg/mL",
 // opcional:
 "alerta":"ex. FOTOSSENSÍVEL - proteger da luz"}
```
Itens com `calcPeso:true` são as drogas vasoativas/sedação tituláveis (ex.: Dobutamina,
Dopamina, Nitroprussiato, Esmolol, Fentanil, Cetamina, Atracúrio, Milrinona) — calculadas em
mL/h a partir de peso e dose-alvo.

### `renalAdjustments` — dicionário de funções por nome de medicamento
Cobre ao menos: Vancomicina, Piperacilina+tazobactam, Meropenem, Ceftazidima, Cefepime,
Levofloxacino, Ciprofloxacino, Cefazolina, Ceftriaxona (sem necessidade de ajuste — eliminação
biliar), Imipenem+cilastatina, Anfotericina B lipossomal, Fluconazol. Cada função recebe o
Clearance de Creatinina (CrCl) e retorna a recomendação textual de ajuste de dose/intervalo.

## Lógica de cálculo (JavaScript)
- **CrCl (Cockcroft-Gault):** `((140 − idade) × peso) / (72 × creatinina)`, multiplicado por
  0,85 se sexo feminino. Classificação: >90 Normal, 60–90 Leve, 30–59 Moderada, 15–29 Grave,
  <15 Falência.
- **Taxa de infusão:** `rate (mL/h) = doseAlvo × peso × fator / concentração`, onde `fator = 60`
  se a unidade contiver "min" (conversão mcg/kg/**min** → mcg/kg/**h**), senão `1`.
- **Alerta de nefrotoxicidade:** se CrCl < 30 mL/min e o medicamento estiver na lista fixa
  `["Vancomicina 500mg","Amicacina 250mg/mL 2mL","Gentamicina 40mg/mL","Anfotericina B",
  "Anfotericina B lipossomal 50mg/10mL"]`, exibe aviso adicional de risco de lesão renal aguda.
- **Caso especial Norepinefrina:** dose máxima padrão é usada normalmente; se o checkbox
  "paciente crítico" estiver marcado, a dose máxima passa a 3,0 mcg/kg/min (`doseMaxStd` vs.
  limite estendido).
- **Alerta de alto fluxo:** se a taxa calculada (mín. ou máx.) ultrapassar 100 mL/h, exibe aviso
  visual (`highFlowWarn`).

## Persistência e UI
- Dados do paciente (peso, idade, sexo, creatinina, flag "crítico") salvos em `localStorage` do
  navegador — perfil de paciente persiste entre usos no mesmo dispositivo/navegador.
- Busca com normalização (remove acentos) e filtro por categoria.
- Botão de copiar para área de transferência do texto final de prescrição (com fallback via
  `document.execCommand('copy')` para navegadores sem suporte à Clipboard API).

## Ponto de atenção para o copiloto
- Esta ferramenta calcula **taxa de infusão (mL/h)**, não a dose absoluta — ao orientar sobre um
  destes fármacos, reproduzir a mesma fórmula (dose-alvo × peso × fator / concentração) e nunca
  arredondar ou simplificar a conversão mcg/kg/min → mcg/kg/h.
- Ajustes renais desta base são recomendações operacionais já compiladas pelo usuário; ao citá-
  las, deixar claro que a fonte é a base pessoal do usuário (não uma diretriz externa citável) e
  sugerir confirmação cruzada com bula/protocolo institucional em caso de dúvida.
