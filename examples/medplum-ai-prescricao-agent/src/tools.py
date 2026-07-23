from __future__ import annotations

from langchain.tools import tool

from src import dose, medplum_fhir


@tool(description="Busca medicamentos na base local por nome genérico ou comercial (retorna até 8 resultados com id).")
def buscar_medicamento(termo: str) -> list[dict]:
    return dose.buscar_medicamentos(termo)


@tool(
    description=(
        "Calcula a dose de referência de um medicamento pelo id retornado por "
        "`buscar_medicamento`. Informe `peso_kg` para pacientes pediátricos. "
        "SEMPRE leia o campo `mensagens` e `texto_raw_referencia` do resultado antes "
        "de sugerir qualquer coisa ao usuário — o número calculado é só um ponto de "
        "partida, nunca a dose final."
    )
)
def calcular_dose(medicamento_id: str, peso_kg: float | None = None) -> dict:
    return dose.calcular_dose(medicamento_id, peso_kg).to_dict()


@tool(
    description=(
        "Cria um MedicationRequest em status DRAFT no Medplum para um paciente existente. "
        "Nunca cria em status 'active' — sempre draft, para exigir revisão humana antes de "
        "qualquer dispensação. Use somente depois de ter confirmado a dose com `calcular_dose` "
        "e de o usuário ter validado explicitamente o texto da prescrição."
    )
)
def criar_pedido_medicamento(patient_id: str, medicamento_nome: str, dose_texto: str) -> dict:
    resultado = medplum_fhir.criar_medication_request(
        patient_id=patient_id,
        medicamento_nome=medicamento_nome,
        dose_texto=dose_texto,
    )
    return {"id": resultado.get("id"), "status": resultado.get("status"), "resourceType": resultado.get("resourceType")}


TOOLS = [buscar_medicamento, calcular_dose, criar_pedido_medicamento]
