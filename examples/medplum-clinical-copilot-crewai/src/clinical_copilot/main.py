#!/usr/bin/env python
from crewai import Agent
from crewai.flow import Flow, listen, or_, router, start
from pydantic import BaseModel

from clinical_copilot.crews.copilot_crew.copilot_crew import GROQ_MODEL, CopilotCrew
from clinical_copilot.tools.tarefas_pessoais import gerenciar_tarefas_pessoais


class CopilotState(BaseModel):
    pergunta: str = ""
    patient_id: str = ""
    categoria: str = ""
    resposta: str = ""


class PersonalCopilotFlow(Flow[CopilotState]):
    """Copilot único: roteia entre a crew clínica (Medplum + base de
    conhecimento) e um assistente pessoal para tarefas do dia a dia."""

    @start()
    def receber_pedido(self, crewai_trigger_payload: dict = None):
        if crewai_trigger_payload:
            self.state.pergunta = crewai_trigger_payload.get("pergunta", "")
            self.state.patient_id = crewai_trigger_payload.get("patient_id", "")

        if not self.state.pergunta:
            self.state.pergunta = input("O que você precisa? ")
        if not self.state.patient_id:
            self.state.patient_id = input(
                "ID do paciente (Patient.id — só se for uma pergunta clínica sobre um "
                "paciente específico; Enter para pular): "
            )

    @router(receber_pedido)
    def rotear(self) -> str:
        """Classifica o pedido como clínico (dados de paciente/protocolo/
        prescrição) ou pessoal (organização, redação, tarefas, cálculos)."""
        if self.state.patient_id:
            self.state.categoria = "clinico"
            return "clinico"

        roteador = Agent(
            role="Roteador de Pedidos",
            goal="Classificar um pedido como 'clinico' ou 'pessoal', sem respondê-lo.",
            backstory=(
                "'clinico' = pergunta sobre um paciente, protocolo clínico, "
                "farmacologia ou prescrição. 'pessoal' = qualquer outra tarefa do "
                "dia a dia, profissional ou pessoal (organização, redação, "
                "lembretes, cálculos, resumos etc.)."
            ),
            llm=GROQ_MODEL,
        )
        resultado = roteador.kickoff(
            f'Pedido: "{self.state.pergunta}"\n\n'
            "Responda com exatamente uma palavra: clinico ou pessoal."
        )
        texto = resultado.raw.strip().lower()
        self.state.categoria = "clinico" if "clinico" in texto or "clínico" in texto else "pessoal"
        return self.state.categoria

    @listen("clinico")
    def responder_clinico(self):
        resultado = CopilotCrew().crew().kickoff(
            inputs={"pergunta": self.state.pergunta, "patient_id": self.state.patient_id}
        )
        self.state.resposta = resultado.raw

    @listen("pessoal")
    def responder_pessoal(self):
        assistente = Agent(
            role="Assistente Pessoal",
            goal=(
                "Ajudar com tarefas do dia a dia, profissionais e pessoais: "
                "organizar tarefas e lembretes, redigir e revisar textos, fazer "
                "cálculos, resumir e organizar informação."
            ),
            backstory=(
                "Você é direto e prático. Use a tool `gerenciar_tarefas_pessoais` "
                "para criar, listar, concluir ou remover tarefas/lembretes quando "
                "for o caso. Quando o pedido depender de um serviço externo que "
                "ainda não está conectado a este agente (e-mail, agenda, "
                "WhatsApp etc.), diga isso claramente e explique que é preciso "
                "conectar esse serviço (ver README) em vez de fingir que a ação "
                "foi executada."
            ),
            llm=GROQ_MODEL,
            tools=[gerenciar_tarefas_pessoais],
        )
        resultado = assistente.kickoff(self.state.pergunta)
        self.state.resposta = resultado.raw

    @listen(or_(responder_clinico, responder_pessoal))
    def mostrar_resposta(self):
        print(f"\n[{self.state.categoria}]\n{self.state.resposta}")


def kickoff():
    PersonalCopilotFlow().kickoff()


def plot():
    PersonalCopilotFlow().plot()


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

    flow = PersonalCopilotFlow()

    try:
        return flow.kickoff({"crewai_trigger_payload": trigger_payload})
    except Exception as e:
        raise Exception(f"Erro ao rodar o flow com trigger: {e}")


if __name__ == "__main__":
    kickoff()
