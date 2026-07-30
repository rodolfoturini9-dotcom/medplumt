import os

from crewai import Agent, Crew, Process, Task
from crewai.agents.agent_builder.base_agent import BaseAgent
from crewai.mcp import MCPServerHTTP
from crewai.project import CrewBase, agent, crew, task

from clinical_copilot.tools.base_conhecimento import buscar_base_conhecimento_clinico
from clinical_copilot.tools.medplum_token import obter_medplum_token

GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/llama-3.3-70b-versatile")


def _medplum_mcp_server() -> MCPServerHTTP:
    """Servidor MCP do Medplum (fhir-request), autenticado via client-credentials.

    O acesso somente leitura é garantido pela AccessPolicy do
    ClientApplication associado ao token — não pela configuração aqui.
    Veja o README deste exemplo antes de rodar contra um projeto real.
    """
    base_url = os.getenv("MEDPLUM_BASE_URL", "https://api.medplum.com")
    mcp_url = os.getenv("MEDPLUM_MCP_URL", f"{base_url}/mcp/stream")
    return MCPServerHTTP(
        url=mcp_url,
        headers={"Authorization": f"Bearer {obter_medplum_token()}"},
        streamable=True,
        cache_tools_list=True,
    )


@CrewBase
class CopilotCrew:
    """Crew do Copilot Clínico: pesquisa FHIR + base de conhecimento + resumo."""

    agents: list[BaseAgent]
    tasks: list[Task]

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def fhir_research_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["fhir_research_agent"],  # type: ignore[index]
            llm=GROQ_MODEL,
            mcps=[_medplum_mcp_server()],
        )

    @agent
    def protocol_research_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["protocol_research_agent"],  # type: ignore[index]
            llm=GROQ_MODEL,
            tools=[buscar_base_conhecimento_clinico],
        )

    @agent
    def clinical_summary_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["clinical_summary_agent"],  # type: ignore[index]
            llm=GROQ_MODEL,
        )

    @task
    def fhir_research_task(self) -> Task:
        return Task(
            config=self.tasks_config["fhir_research_task"],  # type: ignore[index]
        )

    @task
    def protocol_research_task(self) -> Task:
        return Task(
            config=self.tasks_config["protocol_research_task"],  # type: ignore[index]
        )

    @task
    def summary_task(self) -> Task:
        return Task(
            config=self.tasks_config["summary_task"],  # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Cria o Copilot Crew (processo sequencial: pesquisas -> resumo)."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
