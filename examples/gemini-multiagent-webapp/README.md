# Multi-agente Gemini — pronto para deploy no Netlify

Versão web deste [experimento de multi-agentes](../agent-frameworks-langgraph-vs-adk/README.md):
o mesmo fluxo `idea_agent → refiner_agent → estrategista`, mas implementado como uma
**Netlify Function** (Node.js) que chama a API do Gemini diretamente por HTTP, mais uma
página estática simples. Não depende de Python, LangGraph ou Google ADK — por isso roda
no plano gratuito do Netlify sem servidor dedicado.

## O que tem aqui

```
gemini-multiagent-webapp/
├── netlify.toml                  # config do Netlify (publish dir + functions dir)
├── package.json
├── public/
│   └── index.html                # UI: campo de texto + 3 blocos de resultado
└── netlify/functions/
    └── agent.js                  # orquestra as 3 chamadas ao Gemini (idea/refiner/estrategista)
```

## Deploy no Netlify

### Opção A — Netlify CLI (mais rápido)

```bash
cd examples/gemini-multiagent-webapp
npm install -g netlify-cli   # se ainda não tiver
netlify deploy --prod
```

Na primeira execução o CLI pede para linkar/criar um site. Aceite os diretórios padrão
detectados a partir do `netlify.toml` (publish = `public`, functions = `netlify/functions`).

### Opção B — Deploy manual pelo painel (drag & drop / Git)

1. Acesse https://app.netlify.com → **Add new site**.
2. Se for usar Git: aponte para este repositório, defina o **Base directory** como
   `examples/gemini-multiagent-webapp` (build command vazio, publish directory `public`,
   functions directory `netlify/functions` — o `netlify.toml` já cobre isso).
3. Se for drag & drop: comprima a pasta `gemini-multiagent-webapp` e arraste no painel
   (o Netlify detecta `netlify.toml` automaticamente).

### Configure a chave de API (obrigatório)

Um `.env` local já vem preenchido com sua chave (só para `netlify dev` / testes locais —
o deploy em produção **não lê esse arquivo**, o Netlify usa apenas variáveis de ambiente
do próprio site). Para configurar o site publicado, escolha uma opção:

**Via CLI** (não grava a chave em nenhum arquivo, vai direto para o cofre do Netlify):

```bash
netlify env:set GOOGLE_API_KEY "<sua chave>" --context production
```

**Via painel:** **Site configuration → Environment variables → Add a variable**

```
Key:   GOOGLE_API_KEY
Value: <sua chave de https://aistudio.google.com/apikey>
```

Depois de adicionar a variável, faça um **redeploy** do site (a Function só lê a
variável em tempo de execução, mas o Netlify recomenda redeploy após mudar env vars).

> **Nunca** coloque a chave dentro do código, do `netlify.toml` ou de um `.env`
> commitado — o `.gitignore` deste diretório já exclui `.env`. Em produção a chave
> vive só na variável de ambiente do site.

### Testar localmente antes do deploy (opcional)

```bash
cp .env.example .env
# edite .env e cole sua chave em GOOGLE_API_KEY

netlify dev
```

Abre em http://localhost:8888 com a mesma UI e a Function rodando localmente.

## Como funciona

`POST /.netlify/functions/agent` com `{ "topic": "..." }` faz três chamadas
sequenciais ao endpoint `generateContent` do Gemini (`gemini-flash-latest`), uma por
`systemInstruction` diferente:

1. **idea_agent** — brainstorm livre sobre o tema.
2. **refiner_agent** — refina as ideias geradas.
3. **estrategista** — recebe ambas as versões e produz um plano de ação final.

A resposta é `{ topic, ideas, refined, finalPlan }`, renderizada pela UI em três blocos.

## Limitações

- Sem autenticação/rate limiting — se o site for público, qualquer visitante consome sua
  cota de API. Para uso além de demo, adicione autenticação (ex.: Netlify Identity) ou
  um proxy com rate limit na própria Function.
- Cada submissão faz 3 chamadas ao Gemini (custo e latência proporcionais).
- `gemini-flash-latest` é o modelo usado por padrão; troque `GEMINI_MODEL` em
  `netlify/functions/agent.js` se quiser outro.
