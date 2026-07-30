#!/usr/bin/env python
from pydantic import BaseModel

from crewai.flow import Flow, listen, start

from clinical_copilot.crews.copilot_crew.copilot_crew import CopilotCrew


class CopilotState(BaseModel):
    pergunta: str = ""
    patient_id: str = ""
    resumo: str = ""


class ClinicalCopilotFlow(Flow[CopilotState]):

    @start()
    def receber_pergunta(self, crewai_trigger_payload: dict = None):
        if crewai_trigger_payload:
            self.state.pergunta = crewai_trigger_payload.get("pergunta", "")
            self.state.patient_id = crewai_trigger_payload.get("patient_id", "")

        if not self.state.pergunta:
            self.state.pergunta = input("Pergunta clínica: ")
        if not self.state.patient_id:
            self.state.patient_id = input(
                "ID do paciente (Patient.id, opcional — Enter para pular): "
            )

        print(f"\nPergunta: {self.state.pergunta}")
        if self.state.patient_id:
            print(f"Paciente: {self.state.patient_id}")

    @listen(receber_pergunta)
    def pesquisar_e_resumir(self):
        result = CopilotCrew().crew().kickoff(
            inputs={"pergunta": self.state.pergunta, "patient_id": self.state.patient_id}
        )
        self.state.resumo = result.raw
        # A própria task de resumo já grava output/resumo.md (output_file no tasks.yaml).
        print("\n" + self.state.resumo)


def kickoff():
    ClinicalCopilotFlow().kickoff()


def plot():
    ClinicalCopilotFlow().plot()


def run_with_trigger():
    """Roda o flow com um payload de trigger (ex.: chamado por um Bot/webhook do Medplum)."""
    import json
    import sys

    if len(sys.argv) < 2:
        raise Exception("Nenhum payload de trigger fornecido. Passe um JSON como argumento.")

    try:
        trigger_payload = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        raise Exception("Payload JSON inválido.")

    flow = ClinicalCopilotFlow()

    try:
        return flow.kickoff({"crewai_trigger_payload": trigger_payload})
    except Exception as e:
        raise Exception(f"Erro ao rodar o flow com trigger: {e}")


if __name__ == "__main__":
    kickoff()
