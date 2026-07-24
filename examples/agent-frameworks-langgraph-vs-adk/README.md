# Experimento de Frameworks para Testes de Agentes (LangGraph vs Google ADK)

> Adaptado do material de [rhawk.pro](https://rhawk.pro) | Comunidade: [rhawk.pro/comunidade](https://rhawk.pro/comunidade)

## Introdução

Este é um experimento standalone (sem dependência do restante do repositório Medplum)
que apresenta dois frameworks diferentes para criar e testar agentes de IA sobre a
API do Gemini:

1. **Google ADK** — Agent Development Kit do Google
2. **LangGraph** — Framework para desenvolvimento de agentes baseados em grafos

Ambos implementam o mesmo cenário de brinquedo: um `idea_agent` que faz brainstorm,
um `refiner_agent` que refina as ideias, e um agente supervisor/planejador que
orquestra os dois.

Atualmente, existe uma discussão em aberto na comunidade de IA sobre a eficácia e
utilidade dos sistemas multi-agentes:

- **Opiniões contra:** Alguns especialistas argumentam contra a construção de sistemas
  multi-agentes, conforme discutido em
  ["Don't Build Multi-Agents"](https://cognition.ai/blog/dont-build-multi-agents#a-theory-of-building-long-running-agents)
  pela Cognition.ai.
- **Opiniões a favor:** Por outro lado, empresas como a Anthropic demonstram casos de
  sucesso, como detalhado em
  ["How We Built a Multi-Agent Research System"](https://www.anthropic.com/engineering/built-multi-agent-research-system).

Este exemplo serve para comparar as duas abordagens na prática. Veja também
`examples/medplum-ai-prescricao-agent/` neste repositório para um agente LangGraph
real (dose de prescrição, FHIR/Medplum) rodando 100% local via Ollama.

## Pré-requisitos

- Python 3.10 ou superior
- Uma chave de API do Gemini (obtenha em https://aistudio.google.com/apikey)

## Configuração do ambiente

```bash
cd examples/agent-frameworks-langgraph-vs-adk

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copie os arquivos `.env.example` para `.env` e preencha `GOOGLE_API_KEY`:

```bash
cp langgraph/.env.example langgraph/.env
cp agente_adk/multi_agent/.env.example agente_adk/multi_agent/.env
# edite os dois .env e cole sua chave
```

> **Nunca** faça commit de um arquivo `.env` com uma chave real — ambos os `.env`
> já estão no `.gitignore` deste diretório.

## Executando os agentes

### Opção 1: Agente Google ADK

```bash
cd agente_adk
adk web
```

Acesse http://localhost:8000 no navegador.

### Opção 2: Agente LangGraph

```bash
cd langgraph
langgraph dev --allow-blocking
```

Acesse https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024

> **Nota:** recomendamos o uso do navegador Chrome para melhor experiência.

## Estrutura

```
agent-frameworks-langgraph-vs-adk/
├── langgraph/
│   ├── graph.py            # supervisor + idea_agent + refiner_agent (langgraph_supervisor)
│   ├── langgraph.json
│   └── .env.example
├── agente_adk/
│   └── multi_agent/
│       ├── __init__.py
│       ├── agent.py        # mesmo cenário, via google-adk (LlmAgent + sub_agents)
│       └── .env.example
└── requirements.txt
```

## Tutorial em vídeo (material original)

[Vídeo tutorial](https://youtu.be/YLVvZDip27s) explorando o repositório original que
serviu de base para este exemplo.
