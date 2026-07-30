# Copilot Clínico — Medplum + CrewAI + Groq (via MCP)

Protótipo de "copilot" para profissionais de saúde: você faz uma pergunta em
linguagem natural (opcionalmente sobre um paciente específico), e uma
`Flow` do [CrewAI](https://docs.crewai.com/) usa dois agentes — um que
pesquisa dados FHIR no Medplum e outro que redige o resumo — para responder.

A pesquisa acontece através do **servidor MCP do Medplum**
(`/mcp/stream`, tool `fhir-request`), documentado em
[`packages/docs/docs/ai/mcp.md`](../../packages/docs/docs/ai/mcp.md), usando
o suporte nativo a MCP do CrewAI (`Agent(mcps=[...])`,
ver [docs.crewai.com/mcp](https://docs.crewai.com/mcp)). O LLM é servido
pela [Groq](https://console.groq.com/) — inferência rápida e com camada
gratuita, sem depender de OpenAI/Gemini.

Este exemplo foi gerado com `crewai create flow` (scaffold oficial do
CrewAI) e depois adaptado para o caso de uso clínico — veja `AGENTS.md`
para o guia de referência que o CLI já traz sobre a arquitetura do CrewAI.

## Por que "somente leitura" é garantido pelo Medplum, não pelo código

A tool `fhir-request` do MCP do Medplum aceita GET, POST, PUT, PATCH e
DELETE — ela não é uma tool de leitura por natureza. Os agentes são
instruídos (`agents.yaml`/`tasks.yaml`) a usar sempre GET, mas instrução por
prompt **não é uma barreira de segurança confiável**.

A barreira real é a **AccessPolicy** do Medplum:

1. Crie um `ClientApplication` dedicado a este copilot (Admin > Client
   Applications).
2. Crie uma `AccessPolicy` que só permita `read`/`search` (nenhum
   `write`/`delete`) nos tipos de recurso que o copilot deve enxergar
   (Admin > Access Policies).
3. Associe a AccessPolicy ao ClientApplication.

Com isso, mesmo que o modelo tente um POST/PATCH, o servidor Medplum rejeita
— a garantia não depende do LLM se comportar.

## Pré-requisitos

- Python 3.10–3.13
- [uv](https://docs.astral.sh/uv/) (`pip install uv`)
- Uma chave da Groq, gratuita em [console.groq.com/keys](https://console.groq.com/keys)
- Um `ClientApplication` do Medplum com AccessPolicy somente leitura (acima)

## Configuração

```bash
cp .env.example .env
# preencha GROQ_API_KEY, MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET

crewai install
```

## Como rodar

```bash
crewai run
```

O flow pergunta interativamente a pergunta clínica e, opcionalmente, o
`Patient.id` para restringir a busca. O resultado é impresso no terminal e
salvo em `output/resumo.md`.

Para chamar via payload (ex.: a partir de um Bot/webhook do Medplum), use:

```bash
uv run run_with_trigger '{"pergunta": "Quais os últimos resultados de hemograma?", "patient_id": "abc-123"}'
```

## Estrutura

```
medplum-clinical-copilot-crewai/
├── src/clinical_copilot/
│   ├── crews/copilot_crew/
│   │   ├── config/
│   │   │   ├── agents.yaml         # fhir_research_agent, clinical_summary_agent
│   │   │   └── tasks.yaml          # research_task, summary_task
│   │   └── copilot_crew.py         # @CrewBase; conecta o MCP do Medplum via mcps=[...]
│   ├── tools/
│   │   └── medplum_token.py        # client-credentials -> access token do Medplum
│   └── main.py                     # Flow: recebe a pergunta -> pesquisa -> resume
├── AGENTS.md                       # guia de referência CrewAI (gerado pelo CLI)
├── pyproject.toml
└── .env.example
```

## Limitações conhecidas

- O agente de pesquisa depende inteiramente do que a tool `fhir-request`
  retorna; buscas FHIR mal formadas podem fazer o agente concluir
  erroneamente que não há dados.
- Modelos servidos pela Groq (Llama 3.3 70B por padrão) são mais fracos que
  os modelos de ponta em raciocínio clínico complexo — trate a saída como
  rascunho para revisão humana, nunca como decisão final.
- Isto é um protótipo educacional, não um dispositivo médico validado.

## Próximos passos possíveis

- Trocar a pergunta única por uma `Flow` conversacional
  (`flow.handle_turn(mensagem, session_id=...)`), para um copilot com
  múltiplas idas e vindas na mesma sessão.
- Adicionar um terceiro agente que sugira próximos passos (exames,
  encaminhamentos) sempre como rascunho, seguindo o mesmo padrão de
  `MedicationRequest` em `draft` usado em
  `examples/medplum-ai-prescricao-agent`.
- Expor este flow como um Bot do Medplum, chamado via `run_with_trigger`.
