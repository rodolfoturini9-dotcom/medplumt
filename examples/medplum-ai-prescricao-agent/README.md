# Agente de Apoio à Prescrição — Medplum + LangGraph + Ollama (custo zero de API)

Protótipo de agente `create_agent` (LangChain 1.0 / LangGraph 1.0) que roda inteiramente
local via [Ollama](https://ollama.com), sem chave de API paga (nem OpenAI, nem Gemini).
O único custo é o hardware que já roda o modelo.

Segue o mesmo padrão dos exemplos de referência (`create_agent` + `middleware=[...]`),
trocando apenas o provider do modelo: `ChatOllama` no lugar de `ChatOpenAI` /
`ChatGoogleGenerativeAI`.

## Por que não é só "trocar o modelo"

Três decisões de segurança clínica ficam **fora do LLM**, de propósito:

1. **Cálculo de dose é determinístico** (`src/dose.py`), lendo a base local de 289
   medicamentos extraída de `prescricao_plantao.html` (`data/medicamentos.json`). O
   agente nunca calcula mg/kg "de cabeça" — só chama a tool `calcular_dose`.
2. **`MedicationRequest` sempre nasce como `draft`** (`src/medplum_fhir.py`) — o agente
   nunca cria um pedido `active`. Confirmação e assinatura ficam com o profissional,
   dentro do próprio Medplum.
3. **PII brasileira (CPF, telefone) é redigida antes do modelo ver o texto**
   (`src/pii.py`), complementando o `PIIMiddleware` built-in do LangChain (que no
   exemplo de referência só cobre `email`).

## Pré-requisitos

- Python 3.10+
- [Ollama](https://ollama.com) instalado e rodando (`ollama serve`)
- Um modelo baixado localmente, ex.: `ollama pull llama3.1:8b`
  (troque por outro se sua GPU/RAM for mais limitada — ex.: `qwen2.5:7b`, `mistral:7b`)
- (Opcional, só para as tools de FHIR) Um `ClientApplication` no Medplum, criado em
  Admin > Client Applications

## Configuração

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edite .env se for usar um modelo diferente de llama3.1:8b
# ou se for integrar com um projeto Medplum real (MEDPLUM_CLIENT_ID/SECRET)

ollama pull llama3.1:8b
```

## Como rodar

```bash
langgraph dev
```

Abre a interface do LangGraph Studio para testar o agente (`agent`) interativamente.

## Estrutura

```
medplum-ai-prescricao-agent/
├── data/medicamentos.json      # 289 medicamentos extraídos de prescricao_plantao.html
├── src/
│   ├── dose.py                 # cálculo de dose determinístico (sem LLM)
│   ├── pii.py                  # redação de CPF/telefone BR
│   ├── medplum_fhir.py         # cliente FHIR REST mínimo (client-credentials)
│   ├── tools.py                # tools do agente (buscar, calcular, criar draft)
│   └── agente.py               # create_agent + middlewares (exporta `agent`/`graph`)
├── langgraph.json
├── requirements.txt
└── .env.example
```

## Limitações conhecidas (leia antes de usar com paciente real)

- A base `mg_por_kg` guarda **um único número de referência** por medicamento — o texto
  original às vezes descreve uma faixa (ex.: "10 a 15 mg/kg"). `calcular_dose` sempre
  retorna `texto_raw_referencia` junto: **leia o texto original antes de prescrever**.
- A redação de PII por regex é best-effort: um telefone sem formatação (11 dígitos) pode
  ser confundido com CPF sem pontuação. O texto é redigido de qualquer forma, só a
  etiqueta pode sair trocada.
- Modelos locais (7B–8B) são bem mais fracos que GPT-4.1/Gemini 2.5 em raciocínio clínico
  complexo — trate a saída como rascunho para revisão humana, nunca como decisão final.
- Isto é um protótipo educacional, não um dispositivo médico validado.

## Próximos passos possíveis

- Trocar `llama3.1:8b` por um modelo maior (`llama3.1:70b`, `qwen2.5:32b`) se o hardware
  permitir — mesmo código, zero mudança na integração com Medplum.
- Adicionar uma tool de verificação de interação medicamentosa (precisaria de uma base
  de interações — não incluída neste dataset).
- Expor o agente como um Bot do Medplum (webhook) em vez de rodar via `langgraph dev`,
  para chamá-lo a partir do `Prescritor_Ambulatorial.html` / `prescricao_plantao.html`.
