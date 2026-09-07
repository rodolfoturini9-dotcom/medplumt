"""Obtém um access token do Medplum via OAuth 2.0 client-credentials.

Não existe SDK Python oficial do Medplum; este é um cliente REST mínimo,
no mesmo padrão usado em `examples/medplum-ai-prescricao-agent/src/medplum_fhir.py`.

O ClientApplication usado aqui **deve** estar associado a uma AccessPolicy
somente leitura no Medplum (Admin > Access Policies). O token só carrega as
permissões da AccessPolicy — restringir a escrita no lado do servidor é o
que de fato impede o agente de alterar dados, independentemente de quais
métodos HTTP a tool `fhir-request` do MCP exponha.
"""

from __future__ import annotations

import os
import time

import requests

MEDPLUM_BASE_URL = os.getenv("MEDPLUM_BASE_URL", "https://api.medplum.com")
MEDPLUM_CLIENT_ID = os.getenv("MEDPLUM_CLIENT_ID", "")
MEDPLUM_CLIENT_SECRET = os.getenv("MEDPLUM_CLIENT_SECRET", "")

_token: str | None = None
_token_expira_em: float = 0.0


def obter_medplum_token() -> str:
    """Retorna um access token válido, renovando-o quando necessário."""
    global _token, _token_expira_em
    if _token and time.time() < _token_expira_em - 30:
        return _token

    if not MEDPLUM_CLIENT_ID or not MEDPLUM_CLIENT_SECRET:
        raise RuntimeError(
            "MEDPLUM_CLIENT_ID / MEDPLUM_CLIENT_SECRET não configurados no .env. "
            "Crie um ClientApplication no Medplum (Admin > Client Applications) "
            "com uma AccessPolicy somente leitura associada."
        )

    resp = requests.post(
        f"{MEDPLUM_BASE_URL}/oauth2/token",
        data={
            "grant_type": "client_credentials",
            "client_id": MEDPLUM_CLIENT_ID,
            "client_secret": MEDPLUM_CLIENT_SECRET,
        },
        timeout=15,
    )
    resp.raise_for_status()
    payload = resp.json()
    _token = payload["access_token"]
    _token_expira_em = time.time() + payload.get("expires_in", 3600)
    return _token
