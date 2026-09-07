// Netlify Function — ponte entre o site estático (Sistema ISLS) e a API
// Python do Copilot (FastAPI, hospedada fora do Netlify: Render/Railway/
// Fly.io/VPS — ver README de examples/medplum-clinical-copilot-crewai).
//
// O motivo de existir esta função, em vez do widget chamar a API Python
// direto: a COPILOT_API_KEY fica só aqui (variável de ambiente do Netlify),
// nunca no JS que roda no navegador do visitante.
//
// Configure em Netlify > Site configuration > Environment variables:
//   COPILOT_API_URL = https://sua-api.onrender.com/pedido
//   COPILOT_API_KEY = a mesma chave configurada na API (COPILOT_API_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiUrl = process.env.COPILOT_API_URL;
  const apiKey = process.env.COPILOT_API_KEY;

  if (!apiUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "COPILOT_API_URL não configurada no Netlify." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ erro: "JSON inválido." }) };
  }

  if (!body.pergunta || !String(body.pergunta).trim()) {
    return { statusCode: 400, body: JSON.stringify({ erro: "pergunta não pode ser vazia." }) };
  }

  try {
    const resposta = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify({
        pergunta: String(body.pergunta),
        patient_id: String(body.patient_id || ""),
      }),
    });

    const texto = await resposta.text();
    return {
      statusCode: resposta.status,
      headers: { "Content-Type": "application/json" },
      body: texto,
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ erro: `Falha ao chamar a API do Copilot: ${err.message}` }),
    };
  }
};
