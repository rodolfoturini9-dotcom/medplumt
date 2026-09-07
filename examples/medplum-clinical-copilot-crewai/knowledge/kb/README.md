# Base de Conhecimento Clínico — Copiloto Médico (Dr. Rodolfo)

Base de conhecimento consolidada a partir de protocolos institucionais, referências
farmacológicas e templates de documentação médica, organizada para uso como *knowledge*
de um agente de IA atuando como copiloto clínico (Clínica Médica, Medicina Intensiva,
urgência/emergência e enfermaria).

## Estrutura da base

- `01_protocolos_clinicos/` — condutas por queixa, síndrome ou diagnóstico (92 arquivos)
- `02_farmacologia/` — referências por classe medicamentosa (19 arquivos)
- `03_templates_documentacao/` — modelos de evolução, SOAP e prescrição (8 arquivos)
- `04_escalas_e_imagens/` — catálogo de escalas visuais e cards de referência (imagens originais preservadas)
- `05_ferramentas_sistema_isls/` — documentação técnico-funcional do Sistema ISLS (apps de
  impressão, bases de prescrição ambulatorial/hospitalar/pediátrica e calculadora de diluições
  EV/BIC), com os arquivos-fonte originais preservados em `_originais/`
- `06_rag_sistema_unificado/` — **camada de consulta RAG consolidada**: banco SQLite com busca
  full-text (BM25) sobre todo o conteúdo textual + toda a base de prescrição unificada (2.779
  itens), índices JSON para uso client-side sem backend, e CLI Python de consulta. Ver
  `06_rag_sistema_unificado/README.md` para instruções de uso e arquitetura.

## Instruções de uso para o agente de IA (system prompt sugerido)

> Você é um copiloto clínico de apoio à decisão para um médico atuando em Clínica Médica,
> Medicina Intensiva, urgência/emergência e enfermaria hospitalar. Utilize esta base de
> conhecimento como referência prioritária para protocolos institucionais, condutas,
> prescrições-modelo e templates de documentação. Para localizar rapidamente o conteúdo
> relevante, use a camada de busca RAG em `06_rag_sistema_unificado/` (banco `rag_isls.sqlite`
> com busca full-text BM25 sobre documentos e sobre a base unificada de medicamentos) em vez de
> percorrer manualmente os arquivos individuais. Ao responder:
> 1. Baseie-se primeiro nos resultados da busca RAG; quando o tema não estiver coberto ou a
>    informação puder estar desatualizada, informe isso explicitamente e sugira checagem
>    em diretrizes vigentes (sociedades médicas, UpToDate, PubMed).
> 2. Nunca invente doses, condutas ou dados de paciente. Não presuma peso, função renal,
>    alergias ou comorbidades não informados.
> 3. Ao gerar prescrições ou evoluções, utilize os templates de `03_templates_documentacao/`
>    como estrutura, preenchendo apenas com dados fornecidos e omitindo campos sem informação
>    (salvo instrução para uso de "[não informado]").
> 4. Diferencie protocolo institucional (conteúdo desta base) de recomendação baseada em
>    literatura externa.
> 5. Ao usar a base unificada de medicamentos, sempre reporte `contexto` e `fonte` do item
>    retornado (ex.: ambulatorial vs. hospitalar vs. diluição EV/BIC) — nunca tratar itens de
>    contextos diferentes como intercambiáveis.
> 6. Esta base reflete protocolos e templates vigentes na data de sua consolidação
>    (2026-07-30); doses e condutas devem ser
>    periodicamente revalidadas contra as fontes oficiais.

## Ferramentas e Sistemas (Sistema ISLS)

A pasta `05_ferramentas_sistema_isls/` documenta um conjunto de aplicativos HTML/JS de uso
pessoal para geração de documentos impressos, cálculo de diluições/BIC e bases de dados de
prescrição (ambulatorial, hospitalar e pediátrica). Arquivos:

- [Visão geral do Sistema ISLS](05_ferramentas_sistema_isls/00_VISAO_GERAL_SISTEMA_ISLS.md)
- [Motor de impressão (impressao.js)](05_ferramentas_sistema_isls/impressao_js.md)
- [Base ambulatorial (data-ambulatorio.js)](05_ferramentas_sistema_isls/data_ambulatorio_js.md)
- [Base hospitalar (data-hospitalar.js)](05_ferramentas_sistema_isls/data_hospitalar_js.md)
- [Bases pediátricas complementares](05_ferramentas_sistema_isls/data_ped_rodolfo_e_prontuario_js.md)
- [Base de exames (data-exames.js)](05_ferramentas_sistema_isls/data_exames_js.md)
- [Calculadora de Diluições/BIC (Diluic_o_es.html)](05_ferramentas_sistema_isls/Diluicoes_html.md)

Estas bases contêm dados operacionais de prescrição (textos prontos e fórmulas de cálculo por
peso), distintos em natureza dos protocolos clínicos referenciados de `01_protocolos_clinicos` —
ver observações de uso no arquivo de visão geral.

## Limitações conhecidas

- Dois materiais comerciais de terceiros (guia e workbook sobre dor) não foram incorporados
  por serem majoritariamente imagens e por questão de direitos autorais — ver
  `04_escalas_e_imagens/MATERIAIS_NAO_INCLUIDOS.md`.
- Escalas e cards visuais (RASS, CAM-ICU, HINTS, VM PCV/VCV, potência de corticoides,
  comparativo de estatinas) foram preservados como imagem original, não como texto —
  ver `04_escalas_e_imagens/CATALOGO_IMAGENS.md`.
- Alguns nomes de arquivo têm acentuação parcialmente corrigida automaticamente a partir dos
  nomes originais (que estavam com codificação corrompida); o conteúdo clínico em si não foi
  alterado, apenas os títulos.

---

## Protocolos Clínicos

- [Anafilaxia](01_protocolos_clinicos/Anafilaxia.md)
- [CELULITE E ERISIPELA](01_protocolos_clinicos/CELULITE_E_ERISIPELA.md)
- [CETOACIDOSédiaBética](01_protocolos_clinicos/CETOACIDOSédiaBética.md)
- [CONJUNTIVITE VIRAL](01_protocolos_clinicos/CONJUNTIVITE_VIRAL.md)
- [CONSTIPAção](01_protocolos_clinicos/CONSTIPAção.md)
- [CONTROLE DE PA AMBULATORIAL](01_protocolos_clinicos/CONTROLE_DE_PA_AMBULATORIAL.md)
- [Candidíase Vaginal](01_protocolos_clinicos/Candidíase_Vaginal.md)
- [Cefaleia - Anamnese Dirigida e Sinais de alarme](01_protocolos_clinicos/Cefaleia_-_Anamnese_Dirigida_e_Sinais_de_alarme.md)
- [Cefaleia Tensional](01_protocolos_clinicos/Cefaleia_Tensional.md)
- [Cefaleia em Salvas](01_protocolos_clinicos/Cefaleia_em_Salvas.md)
- [Ceftriaxona Hospital Dia](01_protocolos_clinicos/Ceftriaxona_Hospital_Dia.md)
- [Chikungunya](01_protocolos_clinicos/Chikungunya.md)
- [Cistite](01_protocolos_clinicos/Cistite.md)
- [Conjuntivite Bacteriana Aguda](01_protocolos_clinicos/Conjuntivite_Bacteriana_Aguda.md)
- [Crise (Hipertensiva no PA)](01_protocolos_clinicos/Crise_Hipertensiva_no_PA.md)
- [Crise Convulsiva](01_protocolos_clinicos/Crise_Convulsiva.md)
- [Crise Convulsiva Completo](01_protocolos_clinicos/Crise_Convulsiva_Completo.md)
- [Crise de Ansiedade](01_protocolos_clinicos/Crise_de_Ansiedade.md)
- [Crise de Asma](01_protocolos_clinicos/Crise_de_Asma.md)
- [DELIRIUM](01_protocolos_clinicos/DELIRIUM.md)
- [DISENTERIA](01_protocolos_clinicos/DISENTERIA.md)
- [DIVERTICULITE AGUDA COMPLICADA](01_protocolos_clinicos/DIVERTICULITE_AGUDA_COMPLICADA.md)
- [DIVERTICULITE AGUDA não COMPLICADA](01_protocolos_clinicos/DIVERTICULITE_AGUDA_não_COMPLICADA.md)
- [DRGE](01_protocolos_clinicos/DRGE.md)
- [Dengue Grupo C - Emergência](01_protocolos_clinicos/Dengue_Grupo_C_-_Emergência.md)
- [Dengue Grupo D - Emergência](01_protocolos_clinicos/Dengue_Grupo_D_-_Emergência.md)
- [Dengue Grupos A e B - Domiciliar](01_protocolos_clinicos/Dengue_Grupos_A_e_B_-_Domiciliar.md)
- [Descolonização - Furunculose de repetição](01_protocolos_clinicos/Descolonização_-_Furunculose_de_repetição.md)
- [Diario da Cefaleia](01_protocolos_clinicos/Diario_da_Cefaleia.md)
- [Dor Osteomuscular](01_protocolos_clinicos/Dor_Osteomuscular.md)
- [ESCABIOSE](01_protocolos_clinicos/ESCABIOSE.md)
- [Edema Agudo de Pulmão](01_protocolos_clinicos/Edema_Agudo_de_Pulmão.md)
- [Edema Pulmonar de Reexpansão](01_protocolos_clinicos/Edema_Pulmonar_de_Reexpansão.md)
- [Emergência Hipertensiva](01_protocolos_clinicos/Emergência_Hipertensiva.md)
- [Enxaqueca - Migrânea](01_protocolos_clinicos/Enxaqueca_-_Migrânea.md)
- [Epistaxe](01_protocolos_clinicos/Epistaxe.md)
- [Faringite Bacteriana](01_protocolos_clinicos/Faringite_Bacteriana.md)
- [Fibrilação Atrial](01_protocolos_clinicos/Fibrilação_Atrial.md)
- [Gastrite](01_protocolos_clinicos/Gastrite.md)
- [Gastroenterite viral aguda](01_protocolos_clinicos/Gastroenterite_viral_aguda.md)
- [Hemorroida](01_protocolos_clinicos/Hemorroida.md)
- [Herpes Labial](01_protocolos_clinicos/Herpes_Labial.md)
- [Hipercalemia](01_protocolos_clinicos/Hipercalemia.md)
- [Hipocalemia](01_protocolos_clinicos/Hipocalemia.md)
- [Hipoglicemia](01_protocolos_clinicos/Hipoglicemia.md)
- [Hipoglicemia 2](01_protocolos_clinicos/Hipoglicemia_2.md)
- [Hipotireoidismo](01_protocolos_clinicos/Hipotireoidismo.md)
- [Hordelo e Terc ol](01_protocolos_clinicos/Hordelo_e_Terc_ol.md)
- [INSULINA EM BOMBA](01_protocolos_clinicos/INSULINA_EM_BOMBA.md)
- [Knowledge](01_protocolos_clinicos/Knowledge.md)
- [LESAO DE PELE - PRURIDO](01_protocolos_clinicos/LESAO_DE_PELE_-_PRURIDO.md)
- [MICOSE](01_protocolos_clinicos/MICOSE.md)
- [Manutenção de Sedação - Resumido](01_protocolos_clinicos/Manutenção_de_Sedação_-_Resumido.md)
- [Medicac o es para Intubação - Resumido](01_protocolos_clinicos/Medicac_o_es_para_Intubação_-_Resumido.md)
- [Monilíase Oral](01_protocolos_clinicos/Monilíase_Oral.md)
- [Mordedura](01_protocolos_clinicos/Mordedura.md)
- [Onicomicose](01_protocolos_clinicos/Onicomicose.md)
- [Otite Media](01_protocolos_clinicos/Otite_Media.md)
- [PEP](01_protocolos_clinicos/PEP.md)
- [PNEUMONIA ADQUIRIDA NA COMUNIDADE](01_protocolos_clinicos/PNEUMONIA_ADQUIRIDA_NA_COMUNIDADE.md)
- [PNEUMONIA ADQUIRIDA NA COMUNIDADE](01_protocolos_clinicos/PNEUMONIA_ADQUIRIDA_NA_COMUNIDADE.md)
- [PNEUMONIA PACIENTE COM INDICAção DE INTERNAção](01_protocolos_clinicos/PNEUMONIA_PACIENTE_COM_INDICAção_DE_INTERNAção.md)
- [Pielonefrite Complicada](01_protocolos_clinicos/Pielonefrite_Complicada.md)
- [Pielonefrite não complicada](01_protocolos_clinicos/Pielonefrite_não_complicada.md)
- [Prescrição de SCA](01_protocolos_clinicos/Prescrição_de_SCA.md)
- [Profilaxias Cefaleia](01_protocolos_clinicos/Profilaxias_Cefaleia.md)
- [Programação Inicial do VM - Modo PCV](01_protocolos_clinicos/Programação_Inicial_do_VM_-_Modo_PCV.md)
- [Protocolo de anticoagulação ambulatorial](01_protocolos_clinicos/Protocolo_de_anticoagulação_ambulatorial.md)
- [Queimaduras](01_protocolos_clinicos/Queimaduras.md)
- [Reposição Oral de Ferro](01_protocolos_clinicos/Reposição_Oral_de_Ferro.md)
- [Reposição Parenteral de Ferro](01_protocolos_clinicos/Reposição_Parenteral_de_Ferro.md)
- [Reposição de Vitamina B12](01_protocolos_clinicos/Reposição_de_Vitamina_B12.md)
- [Reposição de Vitamina D](01_protocolos_clinicos/Reposição_de_Vitamina_D.md)
- [Resfriado e Gripe](01_protocolos_clinicos/Resfriado_e_Gripe.md)
- [Resumo Intubação Orotraqueal Completo](01_protocolos_clinicos/Resumo_Intubação_Orotraqueal_Completo.md)
- [SINDROME GRIPAL EDITADA](01_protocolos_clinicos/SINDROME_GRIPAL_EDITADA.md)
- [SOLUC O ES CRISTALOIDES - COMPLETO](01_protocolos_clinicos/SOLUC_O_ES_CRISTALOIDES_-_COMPLETO.md)
- [Sifilis Primária (Cancro Duro )](01_protocolos_clinicos/Sifilis_Primária_Cancro_Duro.md)
- [Sinusite Bacteriana](01_protocolos_clinicos/Sinusite_Bacteriana.md)
- [Soluc o es Cristaloides](01_protocolos_clinicos/Soluc_o_es_Cristaloides.md)
- [Sondagem Vesical de Alívio](01_protocolos_clinicos/Sondagem_Vesical_de_Alívio.md)
- [Sutura](01_protocolos_clinicos/Sutura.md)
- [Tontura e Vertigem](01_protocolos_clinicos/Tontura_e_Vertigem.md)
- [Tosse](01_protocolos_clinicos/Tosse.md)
- [Tosse Po s-Infecciosa](01_protocolos_clinicos/Tosse_Po_s-Infecciosa.md)
- [Transfusão Concentrado de Hemácias](01_protocolos_clinicos/Transfusão_Concentrado_de_Hemácias.md)
- [Tratamento H pylori](01_protocolos_clinicos/Tratamento_H_pylori.md)
- [URTICária](01_protocolos_clinicos/URTICária.md)
- [Uretrite](01_protocolos_clinicos/Uretrite.md)
- [Urgência Hipertensiva](01_protocolos_clinicos/Urgência_Hipertensiva.md)
- [Vaginose bacteriana](01_protocolos_clinicos/Vaginose_bacteriana.md)
- [Zika Vírus](01_protocolos_clinicos/Zika_Vírus.md)


---

## Farmacologia por Classe

- [Antidepressivos Tricíclicos](02_farmacologia/Antidepressivos_Tricíclicos.md)
- [Antieméticos](02_farmacologia/Antieméticos.md)
- [BLOQUEADORES DO RECEPTOR DE ANGIOTENSINA - BRAs](02_farmacologia/BLOQUEADORES_DO_RECEPTOR_DE_ANGIOTENSINA_-_BRAs.md)
- [Cefalosporinas](02_farmacologia/Cefalosporinas.md)
- [Corticoides](02_farmacologia/Corticoides.md)
- [Diureticos de Alça](02_farmacologia/Diureticos_de_Alça.md)
- [Dobutamina](02_farmacologia/Dobutamina.md)
- [Estatinas](02_farmacologia/Estatinas.md)
- [Hidroclorotiazida](02_farmacologia/Hidroclorotiazida.md)
- [INIBIDORES DA BOMBA DE prótons - IBP](02_farmacologia/INIBIDORES_DA_BOMBA_DE_prótons_-_IBP.md)
- [INIBIDORES DA ECA](02_farmacologia/INIBIDORES_DA_ECA.md)
- [Macrolídeos - Azitromicina](02_farmacologia/Macrolídeos_-_Azitromicina.md)
- [Medicamentos que diminuem o limiar convulsivo](02_farmacologia/Medicamentos_que_diminuem_o_limiar_convulsivo.md)
- [Neurolépticos e Antipsicóticos](02_farmacologia/Neurolépticos_e_Antipsicóticos.md)
- [Noradrenalina](02_farmacologia/Noradrenalina.md)
- [Opioides](02_farmacologia/Opioides.md)
- [Penicilinas](02_farmacologia/Penicilinas.md)
- [Quinolonas](02_farmacologia/Quinolonas.md)
- [Warfarina](02_farmacologia/Warfarina.md)


---

## Templates de Documentação

- [CURB E PSI - PNEUMONIA](03_templates_documentacao/CURB_E_PSI_-_PNEUMONIA.md)
- [EVOLUCAO PADRAO PS - HOMEM](03_templates_documentacao/EVOLUCAO_PADRAO_PS_-_HOMEM.md)
- [EVOLUCAO PADRAO PS - MULHER](03_templates_documentacao/EVOLUCAO_PADRAO_PS_-_MULHER.md)
- [EVOLUCAO padrão internação - HOMEM](03_templates_documentacao/EVOLUCAO_padrão_internação_-_HOMEM.md)
- [Exemplo de Prescrição](03_templates_documentacao/Exemplo_de_Prescrição.md)
- [Exemplo de Prescrição Noradrenalina](03_templates_documentacao/Exemplo_de_Prescrição_Noradrenalina.md)
- [Prescrição padrão de Internação](03_templates_documentacao/Prescrição_padrão_de_Internação.md)
- [SOAP](03_templates_documentacao/SOAP.md)

