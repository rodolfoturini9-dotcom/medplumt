# Copilot Pessoal — Clínico (Medplum + CrewAI + Groq) + Assistente do dia a dia

Um único agente com duas frentes:

- **Copilot clínico**: você faz uma pergunta em linguagem natural
  (opcionalmente sobre um `Patient.id` específico) e uma `Flow` do
  [CrewAI](https://docs.crewai.com/) aciona três agentes — um que pesquisa
  dados FHIR no Medplum, um que pesquisa a sua **base de conhecimento
  clínico pessoal** (`knowledge/kb/`), e um que combina os dois em um
  resumo — para responder.
- **Assistente pessoal**: pedidos que não são sobre um paciente (organizar
  tarefas/lembretes, redigir e revisar textos, cálculos, resumir
  informação) vão para um agente de propósito geral com uma tool de
  tarefas persistente.

Um `@router` no início do flow decide para qual das duas frentes o pedido
vai — você não precisa escolher manualmente.

A pesquisa clínica no Medplum acontece através do **servidor MCP do
Medplum** (`/mcp/stream`, tool `fhir-request`), documentado em
[`packages/docs/docs/ai/mcp.md`](../../packages/docs/docs/ai/mcp.md), usando
o suporte nativo a MCP do CrewAI (`Agent(mcps=[...])`, ver
[docs.crewai.com/mcp](https://docs.crewai.com/mcp)). O LLM é servido pela
[Groq](https://console.groq.com/) — inferência rápida e com camada
gratuita.

Este exemplo foi gerado com `crewai create flow` (scaffold oficial do
CrewAI) e depois adaptado — veja `AGENTS.md` para o guia de referência que
o CLI já traz sobre a arquitetura do CrewAI.

## A base de conhecimento (`knowledge/kb/`)

É a base de conhecimento clínico pessoal fornecida (protocolos, farmacologia
por classe, templates de documentação, documentação do Sistema ISLS e a
base de prescrição/medicamentos unificada) — ver
[`knowledge/kb/README.md`](knowledge/kb/README.md) para o índice completo e
as instruções de uso originais da base.

O agente `protocol_research_agent` não faz RAG por embeddings — a base já
vem com uma camada de busca full-text pronta e testada
(`knowledge/kb/06_rag_sistema_unificado/rag_isls.sqlite`, FTS5/BM25), então
a tool `buscar_base_conhecimento_clinico`
(`src/clinical_copilot/tools/base_conhecimento.py`) só reexpõe essa mesma
consulta (a mesma lógica de `consultar_rag.py`, que continua funcionando
como CLI standalone dentro de `knowledge/kb/06_rag_sistema_unificado/`) como
tool do agente.

Se as pastas `01`–`05` da base forem atualizadas, o SQLite (`06_rag_sistema_unificado`)
é um artefato derivado e precisa ser regenerado — não edite o `.sqlite`
manualmente (mesma observação já feita no README original da base).

## Por que "somente leitura" no Medplum é garantido pelo servidor, não pelo código

A tool `fhir-request` do MCP do Medplum aceita GET, POST, PUT, PATCH e
DELETE — ela não é uma tool de leitura por natureza. O agente é instruído
(`agents.yaml`/`tasks.yaml`) a usar sempre GET, mas instrução por prompt
**não é uma barreira de segurança confiável**.

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
  — só necessário para as perguntas clínicas com `Patient.id`; o resto do
  copilot funciona sem Medplum configurado.

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

O flow pergunta interativamente o que você precisa e, se for uma pergunta
clínica sobre um paciente específico, o `Patient.id` (Enter para pular).
A resposta é impressa no terminal; a resposta clínica também é salva em
`output/resumo.md`; tarefas pessoais ficam em `output/tarefas.json`.

Para chamar via payload (ex.: a partir de um Bot/webhook do Medplum), use:

```bash
uv run run_with_trigger '{"pergunta": "Quais os últimos resultados de hemograma?", "patient_id": "abc-123"}'
uv run run_with_trigger '{"pergunta": "Adicione uma tarefa: revisar prontuários pendentes até sexta"}'
```

## Integração com Netlify / Sistema ISLS

O Netlify hospeda ótimo site estático + Netlify Functions, mas **não é o
lugar de rodar o Flow em Python diretamente** — os 3 agentes da frente
clínica rodam em sequência e cada chamada de LLM pode levar alguns
segundos, o que estoura fácil o timeout de uma função serverless (10s no
plano free do Netlify, 26s no Pro). A arquitetura que funciona:

```
Site ISLS no Netlify (estático)
        │  fetch('/.netlify/functions/copilot', {...})
        ▼
Netlify Function (netlify/functions/copilot.js)   ← só repassa a chamada,
        │  fetch(COPILOT_API_URL, header X-API-Key)   guarda a API key
        ▼
API Python (src/clinical_copilot/api.py, FastAPI)  ← roda o Flow de verdade
        hospedada em Render/Railway/Fly.io/um VPS
```

### 1. Hospede `api.py` em algo que segure processo Python

O Netlify não serve para isso; qualquer host de app Python funciona — o
exemplo abaixo usa [Render](https://render.com) (tem plano free):

1. Crie um **Web Service** no Render apontando para este diretório do repo.
2. Build command: `pip install uv && uv sync`
3. Start command: `uv run uvicorn clinical_copilot.api:app --host 0.0.0.0 --port $PORT`
   (o `Procfile` já documenta esse comando, útil também em Railway/Heroku-like).
4. Configure as variáveis de ambiente do `.env.example` nesse serviço, mais:
   - `COPILOT_API_KEY` — invente uma chave qualquer (ex.: `openssl rand -hex 24`).
     Sem isso, `/pedido` fica público para quem souber a URL — quem pagar a
     conta da Groq/Medplum é você.
   - `COPILOT_ALLOWED_ORIGINS` — o domínio do seu site Netlify (ex.:
     `https://seu-site.netlify.app`), para o CORS não aceitar qualquer origem.
5. Depois do deploy, teste: `curl -X POST https://sua-api.onrender.com/pedido -H "X-API-Key: SUACHAVE" -H "Content-Type: application/json" -d '{"pergunta":"oi"}'`

### 2. No repositório do seu site Netlify (o Sistema ISLS)

Copie estes dois arquivos deste exemplo para o repositório do seu site:

- `netlify/functions/copilot.js` → `netlify/functions/copilot.js` no seu repo
- `netlify/widget/copilot-widget.js` → em qualquer pasta servida estaticamente
  (ex.: `public/js/copilot-widget.js`)

No `netlify.toml` do seu site (crie se não existir):

```toml
[build]
  functions = "netlify/functions"
```

Nas variáveis de ambiente do **site** no Netlify (Site configuration >
Environment variables), configure:

- `COPILOT_API_URL` = `https://sua-api.onrender.com/pedido`
- `COPILOT_API_KEY` = a mesma chave que você colocou no Render

Em qualquer página HTML do ISLS onde quiser o botão de chat:

```html
<script src="/js/copilot-widget.js"></script>
```

Isso adiciona um botão flutuante (💬) que abre um painel simples: campo de
pergunta, campo opcional de `Patient.id`, e a resposta do copilot — sem
nenhuma dependência externa, no mesmo espírito vanilla-JS dos outros apps
do Sistema ISLS.

### Por que a Netlify Function no meio, e não o widget chamando a API direto

Se o widget chamasse `COPILOT_API_URL` diretamente, a `COPILOT_API_KEY`
precisaria estar no JS que roda no navegador — qualquer visitante consegue
ler no DevTools. A Netlify Function fica entre os dois só para manter essa
chave no servidor. Isso ainda não é "multiusuário seguro" (é uma chave
compartilhada, pensada para o seu uso pessoal) — se um dia este copilot for
exposto para outras pessoas além de você, aí sim precisa de autenticação de
verdade (login), não só uma chave fixa.

## Estrutura

```
medplum-clinical-copilot-crewai/
├── knowledge/kb/                       # base de conhecimento clínico pessoal (ver kb/README.md)
├── src/clinical_copilot/
│   ├── crews/copilot_crew/             # frente clínica
│   │   ├── config/
│   │   │   ├── agents.yaml             # fhir_research_agent, protocol_research_agent, clinical_summary_agent
│   │   │   └── tasks.yaml              # fhir_research_task, protocol_research_task, summary_task
│   │   └── copilot_crew.py             # @CrewBase; MCP do Medplum + tool da base de conhecimento
│   ├── tools/
│   │   ├── medplum_token.py            # client-credentials -> access token do Medplum
│   │   ├── base_conhecimento.py        # tool de busca full-text sobre knowledge/kb/
│   │   └── tarefas_pessoais.py         # tool de tarefas/lembretes (persistência local em JSON)
│   ├── main.py                         # Flow: recebe o pedido -> roteia -> clínico ou pessoal
│   └── api.py                          # API HTTP (FastAPI) que expõe o Flow — ver seção Netlify abaixo
├── netlify/
│   ├── functions/copilot.js            # Netlify Function: proxy que guarda a API key no servidor
│   └── widget/copilot-widget.js        # widget de chat (vanilla JS) para colar no site estático
├── Procfile                            # `web: uvicorn ...` — para hospedar api.py em Render/Railway/etc.
├── AGENTS.md                           # guia de referência CrewAI (gerado pelo CLI)
├── pyproject.toml
└── .env.example
```

## O assistente pessoal, hoje e daqui pra frente

O agente pessoal (`responder_pessoal` em `main.py`) já sabe organizar
tarefas/lembretes (tool `gerenciar_tarefas_pessoais`, persistida em
`output/tarefas.json`) e ajudar com redação, cálculos e organização de
informação usando só o raciocínio do LLM — isso funciona hoje, sem nenhuma
conta externa conectada.

"Executar toda tarefa do dia a dia" no sentido de mexer em e-mail, agenda,
WhatsApp etc. exige conectar esses serviços — não dá para fabricar isso sem
suas credenciais. O caminho para estender (documentado em
`getting-started/references/mcp-servers.md` do
[repositório oficial de skills do crewAI](https://github.com/crewAIInc/crewai-skills))
é o campo `mcps` do `Agent`, com um servidor MCP oficial do serviço, ex.:

```python
Agent(
    ...,
    mcps=[
        "gmail",                    # se você conectar o Gmail na sua conta CrewAI
        "google-calendar",
        "https://mcp.algum-servico.com/mcp?api_key=SUA_CHAVE",
    ],
)
```

O agente é instruído a **dizer explicitamente** quando um pedido depender
de um serviço ainda não conectado, em vez de fingir que executou a ação —
mesma filosofia de segurança do resto deste exemplo (nunca simular uma
ação que não foi realmente executada).

## Limitações conhecidas

- `llm="groq/..."` depende do LiteLLM (`litellm` já está em
  `pyproject.toml`) — Groq não é um provider nativo do `crewai.LLM`.
- O agente de pesquisa FHIR depende inteiramente do que a tool
  `fhir-request` retorna; buscas mal formadas podem fazer o agente concluir
  erroneamente que não há dados.
- A busca na base de conhecimento é full-text (BM25), não semântica —
  sinônimos muito distintos do texto original podem não ser encontrados.
- Modelos servidos pela Groq (Llama 3.3 70B por padrão) são mais fracos que
  os modelos de ponta em raciocínio clínico complexo — trate toda saída
  clínica como rascunho para revisão humana, nunca como decisão final.
- Isto é um protótipo educacional, não um dispositivo médico validado.

## Próximos passos possíveis

- Trocar a pergunta única por uma `Flow` conversacional
  (`flow.handle_turn(mensagem, session_id=...)`), para múltiplas idas e
  vindas na mesma sessão.
- Conectar serviços pessoais reais (e-mail, agenda) via `mcps=[...]`, como
  descrito acima.
- Adicionar um agente que sugira próximos passos clínicos (exames,
  encaminhamentos) sempre como rascunho, seguindo o mesmo padrão de
  `MedicationRequest` em `draft` usado em
  `examples/medplum-ai-prescricao-agent`.
- Expor este flow como um Bot do Medplum, chamado via `run_with_trigger`.
