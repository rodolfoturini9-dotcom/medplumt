from langchain_google_genai import ChatGoogleGenerativeAI

from langgraph_supervisor import create_supervisor
from langgraph.prebuilt import create_react_agent

import os
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
)


idea_agent = create_react_agent(
    model=model,
    name="idea_agent",
    tools=[],
    prompt=f"""Você é um agente de ideias. Faça um brainstorm e seja criativo"""
)

refiner_agent = create_react_agent(
    model=model,
    name="refiner_agent",
    tools=[],
    prompt="""Você é responsável por refinar as ideias geradas pelo agente "idea_agent"."""
)

workflow = create_supervisor(
    agents=[idea_agent,refiner_agent],
    model=model,
    prompt=f"""Você é um estrategista de negócios e especialista em criar sistemas
    que automatizam processos e otimizam resultados.
    Após receber a resposta do agente "idea_agent", SEMPRE
    use o agente "refiner_agent" para refinar a ideia.
    """,
)
agent = workflow.compile()
