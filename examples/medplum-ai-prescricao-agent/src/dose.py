"""Cálculo de posologia determinístico (sem LLM) a partir da base local de medicamentos.

Toda a lógica de dose vive aqui, em Python puro, porque é a parte do sistema onde erro
não é aceitável. O agente de IA nunca calcula dose "de cabeça" — ele só chama
`calcular_dose` e repassa o resultado.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "medicamentos.json"

@dataclass
class ResultadoDose:
    medicamento_id: str
    nome: str
    populacao_usada: str
    dose_mg_kg_referencia: float | None
    dose_calculada_mg: float | None
    peso_kg: float | None
    alerta: bool
    mensagens: list[str] = field(default_factory=list)
    texto_raw_referencia: str | None = None
    apresentacoes: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "medicamento_id": self.medicamento_id,
            "nome": self.nome,
            "populacao_usada": self.populacao_usada,
            "dose_mg_kg_referencia": self.dose_mg_kg_referencia,
            "dose_calculada_mg": self.dose_calculada_mg,
            "peso_kg": self.peso_kg,
            "alerta": self.alerta,
            "mensagens": self.mensagens,
            "texto_raw_referencia": self.texto_raw_referencia,
            "apresentacoes": self.apresentacoes,
        }


_MEDICAMENTOS: list[dict[str, Any]] | None = None


def _carregar_base() -> list[dict[str, Any]]:
    global _MEDICAMENTOS
    if _MEDICAMENTOS is None:
        with DATA_PATH.open(encoding="utf-8") as f:
            _MEDICAMENTOS = json.load(f)
    return _MEDICAMENTOS


def buscar_medicamentos(termo: str, limite: int = 8) -> list[dict[str, Any]]:
    """Busca por nome (genérico ou comercial), case-insensitive, substring match."""
    termo_norm = termo.strip().lower()
    if not termo_norm:
        return []
    resultados = []
    for med in _carregar_base():
        nome = (med.get("nome") or "").lower()
        comercial = (med.get("nome_comercial") or "").lower()
        if termo_norm in nome or termo_norm in comercial:
            resultados.append(
                {
                    "id": med["id"],
                    "nome": med.get("nome"),
                    "nome_comercial": med.get("nome_comercial"),
                    "categoria": med.get("categoria"),
                    "administracao": med.get("administracao"),
                }
            )
        if len(resultados) >= limite:
            break
    return resultados


def _medicamento_por_id(medicamento_id: str) -> dict[str, Any] | None:
    for med in _carregar_base():
        if med.get("id") == medicamento_id:
            return med
    return None


def calcular_dose(medicamento_id: str, peso_kg: float | None = None) -> ResultadoDose:
    """Calcula a dose de referência para um medicamento.

    Se `peso_kg` for informado, tenta aplicar a cláusula pediátrica `mg_por_kg`.
    Caso contrário, ou se não houver cláusula pediátrica, retorna a referência
    de dose fixa (adulto) em texto, sem calcular número algum.

    Isso NUNCA lança exceção para "medicamento não encontrado" — retorna
    `alerta=True` com a mensagem, para o agente sempre poder explicar ao usuário.
    """
    med = _medicamento_por_id(medicamento_id)
    if med is None:
        return ResultadoDose(
            medicamento_id=medicamento_id,
            nome="(desconhecido)",
            populacao_usada="nenhuma",
            dose_mg_kg_referencia=None,
            dose_calculada_mg=None,
            peso_kg=peso_kg,
            alerta=True,
            mensagens=[f"Medicamento com id '{medicamento_id}' não encontrado na base local."],
        )

    clausulas = med.get("posologia_clausulas") or []
    apresentacoes = med.get("apresentacoes") or []
    mensagens: list[str] = []

    clausula_ped = next((c for c in clausulas if c.get("tipo") == "mg_por_kg"), None)

    if peso_kg is not None and clausula_ped is not None:
        dose_ref = clausula_ped.get("dose_mg_kg")
        if dose_ref is None:
            mensagens.append(
                "Cláusula pediátrica encontrada, mas sem valor numérico de mg/kg extraído. "
                "Consulte o texto original."
            )
            return ResultadoDose(
                medicamento_id=med["id"],
                nome=med.get("nome", ""),
                populacao_usada="Pediátrica",
                dose_mg_kg_referencia=None,
                dose_calculada_mg=None,
                peso_kg=peso_kg,
                alerta=True,
                mensagens=mensagens,
                texto_raw_referencia=clausula_ped.get("texto_raw"),
                apresentacoes=apresentacoes,
            )

        dose_calculada = round(dose_ref * peso_kg, 2)
        mensagens.append(
            f"Dose de referência: {dose_ref} mg/kg. O texto original pode descrever uma "
            "faixa (ex.: '10 a 15 mg/kg') — este número é só o valor de partida extraído. "
            "SEMPRE confirme contra `texto_raw_referencia` antes de prescrever."
        )
        return ResultadoDose(
            medicamento_id=med["id"],
            nome=med.get("nome", ""),
            populacao_usada="Pediátrica",
            dose_mg_kg_referencia=dose_ref,
            dose_calculada_mg=dose_calculada,
            peso_kg=peso_kg,
            alerta=False,
            mensagens=mensagens,
            texto_raw_referencia=clausula_ped.get("texto_raw"),
            apresentacoes=apresentacoes,
        )

    # Sem peso ou sem cláusula pediátrica -> devolve a referência textual (adulto/idosos/outros)
    clausula_textual = next(
        (c for c in clausulas if c.get("populacao") in ("Adulta", "Idosos", "Outro/Obs")),
        clausulas[0] if clausulas else None,
    )
    if clausula_textual is None:
        mensagens.append("Nenhuma cláusula de posologia estruturada disponível para este medicamento.")
        return ResultadoDose(
            medicamento_id=med["id"],
            nome=med.get("nome", ""),
            populacao_usada="indefinida",
            dose_mg_kg_referencia=None,
            dose_calculada_mg=None,
            peso_kg=peso_kg,
            alerta=True,
            mensagens=mensagens,
            texto_raw_referencia=med.get("dose_texto"),
            apresentacoes=apresentacoes,
        )

    mensagens.append(
        "Não há cálculo numérico automático para esta população — leia o texto original "
        "e prescreva com base no julgamento clínico."
    )
    return ResultadoDose(
        medicamento_id=med["id"],
        nome=med.get("nome", ""),
        populacao_usada=clausula_textual.get("populacao", "indefinida"),
        dose_mg_kg_referencia=None,
        dose_calculada_mg=None,
        peso_kg=peso_kg,
        alerta=False,
        mensagens=mensagens,
        texto_raw_referencia=clausula_textual.get("texto_raw"),
        apresentacoes=apresentacoes,
    )
