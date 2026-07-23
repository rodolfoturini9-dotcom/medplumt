"""Agente de apoio à prescrição, rodando 100% local via Ollama (sem custo de API).

Mesmo padrão dos exemplos de referência (langchain1.0 / guardrail):
`create_agent` + `middleware=[...]`. A diferença é o provider do modelo — aqui
`ChatOllama` em vez de `ChatOpenAI` / `ChatGoogleGenerativeAI`, então não há
cobrança por token: o custo é só o hardware que já roda o modelo.

Pré-requisito: `ollama pull <MODEL>` (ver README) antes de `langgraph dev`.
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain.agents.middleware import PIIMiddleware, SummarizationMiddleware
from langchain_ollama import ChatOllama

from src.pii import redigir_pii_br
from src.tools import TOOLS

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

SYSTEM_PROMPT = """
Você é um assistente de apoio à decisão para prescrição em plantão. Você NÃO é
o profissional responsável e NUNCA finaliza uma prescrição sozinho.

Regras obrigatórias:
1. Para qualquer dose, sempre chame a ferramenta `calcular_dose` — nunca calcule
   de cabeça. Sempre repasse ao usuário o conteúdo de `texto_raw_referencia` e
   qualquer item de `mensagens`, mesmo que pareça redundante.
2. Se `calcular_dose` retornar `alerta=true` ou não encontrar o medicamento,
   diga isso claramente e recuse sugerir uma dose numérica.
3. Só chame `criar_pedido_medicamento` depois que o usuário confirmar
   explicitamente o texto final da prescrição. O pedido é sempre criado como
   rascunho (draft) — nunca comunique ao usuário que a prescrição está "pronta"
   ou "assinada".
4. Você não substitui julgamento clínico. Para qualquer dúvida de segurança
   (alergia, interação, contraindicação), oriente a consultar bula/farmacêutico.
"""

model = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE_URL,
    temperature=0,
)


agent = None
try:
    from langchain.agents import create_agent

    agent = create_agent(
        model=model,
        tools=TOOLS,
        system_prompt=SYSTEM_PROMPT,
        middleware=[
            SummarizationMiddleware(
                model=model,
                max_tokens_before_summary=2000,
                messages_to_keep=6,
            ),
            PIIMiddleware("email", strategy="redact", apply_to_input=True),
        ],
    )
except Exception as exc:  # pragma: no cover - falha só deve acontecer em setup incompleto
    raise RuntimeError(
        "Falha ao montar o agente. Confirme que `ollama serve` está rodando e que o "
        f"modelo '{OLLAMA_MODEL}' foi baixado com `ollama pull {OLLAMA_MODEL}`."
    ) from exc

# Nome exportado usado pelo langgraph.json ("src/agente.py:agent")
graph = agent


def invocar(mensagem_usuario: str, **kwargs):
    """Ponto de entrada recomendado para uso fora do `langgraph dev`/Studio.

    Redige CPF/telefone BR (via `redigir_pii_br`) antes de enviar ao modelo,
    complementando o `PIIMiddleware` built-in (que só cobre `email`). Chamar
    `agent.invoke(...)` diretamente pula essa redação.
    """
    mensagem_redigida = redigir_pii_br(mensagem_usuario)
    return agent.invoke({"messages": [{"role": "user", "content": mensagem_redigida}]}, **kwargs)
