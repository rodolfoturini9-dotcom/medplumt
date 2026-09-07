# Base `data-exames.js` — Autocomplete de Pedido de Exames

**Variável global:** `window.DATA_EXAMES` (array simples de strings, ~90 itens fixos)

## Estrutura
Lista plana de nomes de exames, organizada informalmente por comentários de seção no próprio
código-fonte: Hematologia, Bioquímica, Inflamação/infecção, Urina, Gasometria, Imagem,
Cardio/neuro, Endoscopia.

Exemplos: "Hemograma completo", "Coagulograma (TP/INR, TTPa)", "Troponina", "BNP",
"Hemocultura (2 amostras)", "Angiotomografia de tórax (protocolo TEP)",
"Ultrassonografia com Doppler de membros inferiores", "Eletroencefalograma (EEG)".

## Extensibilidade
O comentário do cabeçalho indica que itens adicionados pelo usuário em tempo de execução são
somados a esta lista via um mecanismo de armazenamento chamado
`isls_itens_customizados` (escopo `"exames"`) — ou seja, a lista completa em uso pode ser maior
que os itens fixos aqui documentados, incorporando exames personalizados cadastrados
posteriormente pelo usuário.

## Ponto de atenção para o copiloto
- Esta base é apenas uma lista de nomes para busca/autocomplete — não contém indicação clínica,
  valor de referência ou interpretação. Ao sugerir exames com base nela, tratar como catálogo de
  nomenclatura padronizada, não como orientação diagnóstica.
