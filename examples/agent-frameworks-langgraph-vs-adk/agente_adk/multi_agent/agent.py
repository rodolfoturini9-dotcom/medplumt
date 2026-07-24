from google.adk.agents import LlmAgent, LoopAgent


MODEL="gemini-2.5-flash"


idea_agent = LlmAgent (
    model=MODEL,
    name="idea_agent",
    instruction=f"""Você é um agente de ideias. Faça um brainstorm e seja criativo""",
    disallow_transfer_to_peers=False,

)

refiner_agent = LlmAgent(
    model=MODEL,
    name="refiner_agent",
    instruction="""Você é responsável por refinar as ideias geradas pelo agente "idea_agent".""",
    disallow_transfer_to_peers=False,
)

root_agent = LlmAgent(
    model=MODEL,
    name="planner_agent",
    instruction=f"""Você é um estrategista de negócios e especialista em criar sistemas
    que automatizam processos e otimizam resultados.
    Após receber a resposta do agente "idea_agent", SEMPRE
    use o agente "refiner_agent" para refinar a ideia.
    """,
    sub_agents=[idea_agent, refiner_agent],
)
# Você também pode usar o LoopAgent para criar um agente que itera sobre os sub-agentes.
#root_agent = LoopAgent(
#    name="planner_agent",
#    sub_agents=[idea_agent, refiner_agent],
#    max_iterations=3
#)
