# Base `data-ambulatorio.js` — Prescrição Ambulatorial

**Variável global:** `window.DATA_AMBULATORIO` (array único, 1.805 itens)
**Tamanho do arquivo:** ~424 KB

## Origem (conforme comentários do próprio arquivo)
- Base adulta: `Prescritor_Ambulatorial.html` — 1.644 itens, já auditados (150 itens corrompidos
  com `#REF!` removidos previamente).
- Base pediátrica: substituída nesta revisão por `Rodolfo_Medical_Suite_Unificado.html`
  (161 itens), após identificação de erro sistemático de dose máxima (~metade do valor correto)
  em vários itens da base pediátrica anterior.

## Estrutura dos itens

### Itens adultos (`"t":"a"`) — 1.644
```json
{"id":"adulto_0001","t":"a","label":"NOME DA APRESENTAÇÃO",
 "nome":"NOME DA APRESENTAÇÃO",
 "pos":"POSOLOGIA JÁ REDIGIDA (texto pronto para prescrição)",
 "qt":"QUANTIDADE A DISPENSAR"}
```
Texto de posologia já finalizado, sem cálculo — uso direto em receita.

### Itens pediátricos (`"t":"p"`) — 161
Mesma base de campos, acrescida de `formulas`: array de objetos com:
- `indication`, `type` (`per_kg` ou `per_age`), `dosePerKg`, `doseUnit`, `maxDose`, `maxUnit`,
  `template` (texto com `"..."` no lugar da dose calculada), **ou**
- `doseByMonth[12]` / `doseByYear[11+]` para posologia por faixa etária fixa, com `template`.

## Uso pretendido
Autocomplete/busca por nome de medicamento no momento da prescrição ambulatorial; ao selecionar
um item pediátrico, o aplicativo (não incluído neste anexo) deve calcular a dose a partir do
peso/idade informado e substituir `"..."` no `template` pelo valor calculado, respeitando
`maxDose`.

## Ponto de atenção para o copiloto
- Para itens pediátricos, **nunca** calcular ou sugerir a dose final sem peso (ou idade, quando
  a fórmula for por idade) informado pelo usuário — mesma regra de fidelidade a dados já vigente.
- Sempre respeitar `maxDose`/`maxUnit` quando presentes.
- Esta base é per se "texto de prescrição pronto" para os itens adultos — não deve ser
  reinterpretada ou recalculada, apenas reproduzida fielmente.
