"""Cliente FHIR mínimo para o Medplum via REST puro (não existe SDK Python oficial).

Autentica com client credentials (client_id/client_secret de um ClientApplication
configurado no Medplum) e expõe as poucas operações que o agente precisa.
"""

from __future__ import annotations

import os
import time
from typing import Any

import requests

MEDPLUM_BASE_URL = os.getenv("MEDPLUM_BASE_URL", "https://api.medplum.com")
MEDPLUM_CLIENT_ID = os.getenv("MEDPLUM_CLIENT_ID", "")
MEDPLUM_CLIENT_SECRET = os.getenv("MEDPLUM_CLIENT_SECRET", "")

_token: str | None = None
_token_expira_em: float = 0.0


def _obter_token() -> str:
    global _token, _token_expira_em
    if _token and time.time() < _token_expira_em - 30:
        return _token

    if not MEDPLUM_CLIENT_ID or not MEDPLUM_CLIENT_SECRET:
        raise RuntimeError(
            "MEDPLUM_CLIENT_ID / MEDPLUM_CLIENT_SECRET não configurados no .env. "
            "Crie um ClientApplication no Medplum (Admin > Client Applications)."
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


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_obter_token()}",
        "Content-Type": "application/fhir+json",
        "Accept": "application/fhir+json",
    }


def buscar_paciente_por_id(patient_id: str) -> dict[str, Any]:
    resp = requests.get(f"{MEDPLUM_BASE_URL}/fhir/R4/Patient/{patient_id}", headers=_headers(), timeout=15)
    resp.raise_for_status()
    return resp.json()


def criar_medication_request(
    *,
    patient_id: str,
    medicamento_nome: str,
    dose_texto: str,
    status: str = "draft",
    requester_display: str | None = None,
) -> dict[str, Any]:
    """Cria um `MedicationRequest` como rascunho (`status="draft"`).

    Importante: o recurso nasce em `draft`, nunca `active` — a confirmação e
    assinatura final são feitas por um profissional humano dentro do Medplum,
    o agente só prepara o rascunho.
    """
    resource = {
        "resourceType": "MedicationRequest",
        "status": status,
        "intent": "order",
        "subject": {"reference": f"Patient/{patient_id}"},
        "medicationCodeableConcept": {"text": medicamento_nome},
        "dosageInstruction": [{"text": dose_texto}],
        "note": [{"text": "Rascunho gerado por agente de IA — requer revisão e assinatura de um profissional."}],
    }
    if requester_display:
        resource["reporter"] = {"display": requester_display}

    resp = requests.post(
        f"{MEDPLUM_BASE_URL}/fhir/R4/MedicationRequest",
        headers=_headers(),
        json=resource,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()
