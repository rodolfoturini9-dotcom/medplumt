"""API HTTP para o Copilot — a ponte entre um frontend estático (Netlify,
Sistema ISLS etc.) e o Flow do CrewAI, que precisa rodar em um host que
segure processos Python de vida mais longa (Render, Railway, Fly.io, um
VPS). O Netlify não roda isto diretamente — ver README, seção "Integração
com Netlify / Sistema ISLS".

Rodar localmente:
    uv run uvicorn clinical_copilot.api:app --reload --port 8000

Endpoint:
    POST /pedido
    Header: X-API-Key: <COPILOT_API_KEY>
    Body:   {"pergunta": "...", "patient_id": "..."}   # patient_id opcional
    Resp:   {"categoria": "clinico"|"pessoal", "resposta": "..."}
"""

from __future__ import annotations

import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from clinical_copilot.main import PersonalCopilotFlow

API_KEY = os.getenv("COPILOT_API_KEY", "")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("COPILOT_ALLOWED_ORIGINS", "").split(",") if o.strip()]

app = FastAPI(title="Copilot Clínico/Pessoal — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class PedidoRequest(BaseModel):
    pergunta: str
    patient_id: str = ""


class PedidoResponse(BaseModel):
    categoria: str
    resposta: str


def _checar_api_key(x_api_key: str | None) -> None:
    if not API_KEY:
        # Sem COPILOT_API_KEY configurada, o endpoint fica aberto — só ok
        # para teste local. Nunca deixe assim em produção (ver README).
        return
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="X-API-Key inválida ou ausente")


@app.post("/pedido", response_model=PedidoResponse)
def pedido(body: PedidoRequest, x_api_key: str | None = Header(default=None)) -> PedidoResponse:
    _checar_api_key(x_api_key)

    if not body.pergunta.strip():
        raise HTTPException(status_code=400, detail="pergunta não pode ser vazia")

    flow = PersonalCopilotFlow()
    flow.kickoff({"crewai_trigger_payload": {"pergunta": body.pergunta, "patient_id": body.patient_id}})

    return PedidoResponse(categoria=flow.state.categoria, resposta=flow.state.resposta)


@app.get("/saude")
def saude() -> dict:
    """Health check simples, para o serviço de deploy (Render etc.) saber que subiu."""
    return {"status": "ok"}
