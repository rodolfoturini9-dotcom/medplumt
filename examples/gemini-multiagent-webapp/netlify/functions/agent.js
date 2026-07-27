const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGemini(apiKey, systemPrompt, userText) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text).filter(Boolean).join("\n").trim();
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "GOOGLE_API_KEY não configurada. Defina essa variável de ambiente nas configurações do site no Netlify.",
      }),
    };
  }

  let topic;
  try {
    ({ topic } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido no corpo da requisição" }) };
  }

  if (!topic || !topic.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Campo 'topic' é obrigatório" }) };
  }

  try {
    const ideas = await callGemini(
      apiKey,
      "Você é um agente de ideias. Faça um brainstorm e seja criativo.",
      topic,
    );

    const refined = await callGemini(
      apiKey,
      'Você é responsável por refinar as ideias geradas pelo agente "idea_agent". ' +
        "Torne-as mais claras, viáveis e bem estruturadas.",
      ideas,
    );

    const finalPlan = await callGemini(
      apiKey,
      "Você é um estrategista de negócios e especialista em criar sistemas que " +
        "automatizam processos e otimizam resultados. Você recebe as ideias originais " +
        "de um agente de brainstorm e a versão já refinada por um segundo agente, e " +
        "produz um plano de ação final, estruturado e objetivo.",
      `Tema: ${topic}\n\nIdeias (idea_agent):\n${ideas}\n\nIdeias refinadas (refiner_agent):\n${refined}`,
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, ideas, refined, finalPlan }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
