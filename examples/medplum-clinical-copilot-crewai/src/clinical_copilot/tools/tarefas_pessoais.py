"""Tool CrewAI de tarefas/notas pessoais — persistência local em JSON.

Não depende de nenhuma conta externa (e-mail, calendário etc.), então funciona
imediatamente com só as chaves de LLM configuradas. É o ponto de partida do
assistente pessoal; para tarefas que exigem um serviço externo real
(agenda, e-mail, mensagens), veja "Estendendo o assistente pessoal" no README
— isso requer conectar essas contas (via MCP) do seu lado, não é algo que dê
para fabricar sem suas credenciais.
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Literal

from crewai.tools import tool

TAREFAS_PATH = os.getenv(
    "TAREFAS_PESSOAIS_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "..", "output", "tarefas.json"),
)
TAREFAS_PATH = os.path.normpath(TAREFAS_PATH)


def _carregar() -> list[dict]:
    if not os.path.exists(TAREFAS_PATH):
        return []
    with open(TAREFAS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _salvar(tarefas: list[dict]) -> None:
    os.makedirs(os.path.dirname(TAREFAS_PATH), exist_ok=True)
    with open(TAREFAS_PATH, "w", encoding="utf-8") as f:
        json.dump(tarefas, f, ensure_ascii=False, indent=2)


@tool("gerenciar_tarefas_pessoais")
def gerenciar_tarefas_pessoais(
    acao: Literal["adicionar", "listar", "concluir", "remover"],
    descricao: str | None = None,
    tarefa_id: str | None = None,
    contexto: Literal["profissional", "pessoal"] | None = None,
) -> str:
    """Gerencia uma lista de tarefas/lembretes pessoais, persistida localmente.

    Args:
        acao: "adicionar" (requer `descricao`), "listar" (todas, ou filtradas
            por `contexto`), "concluir" (requer `tarefa_id`) ou "remover"
            (requer `tarefa_id`).
        descricao: texto da tarefa, usado em "adicionar".
        tarefa_id: id da tarefa, usado em "concluir"/"remover".
        contexto: "profissional" ou "pessoal", para organizar/filtrar.

    Returns:
        JSON com o resultado da ação (tarefa criada, lista de tarefas, ou
        confirmação).
    """
    tarefas = _carregar()

    if acao == "adicionar":
        if not descricao:
            return json.dumps({"erro": "descricao é obrigatória para adicionar"})
        nova = {
            "id": uuid.uuid4().hex[:8],
            "descricao": descricao,
            "contexto": contexto or "pessoal",
            "concluida": False,
            "criada_em": datetime.now(timezone.utc).isoformat(),
        }
        tarefas.append(nova)
        _salvar(tarefas)
        return json.dumps({"tarefa": nova})

    if acao == "listar":
        filtradas = [t for t in tarefas if contexto is None or t["contexto"] == contexto]
        return json.dumps({"tarefas": filtradas})

    if acao in ("concluir", "remover"):
        if not tarefa_id:
            return json.dumps({"erro": "tarefa_id é obrigatório para " + acao})
        encontrada = next((t for t in tarefas if t["id"] == tarefa_id), None)
        if not encontrada:
            return json.dumps({"erro": f"tarefa {tarefa_id} não encontrada"})
        if acao == "concluir":
            encontrada["concluida"] = True
            _salvar(tarefas)
            return json.dumps({"tarefa": encontrada})
        tarefas.remove(encontrada)
        _salvar(tarefas)
        return json.dumps({"removida": tarefa_id})

    return json.dumps({"erro": f"ação desconhecida: {acao}"})
