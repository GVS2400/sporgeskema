export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: cors });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400, headers: cors });
    }

    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== "string") {
      return new Response("Missing {prompt}", { status: 400, headers: cors });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 1600,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return new Response(`OpenAI error: ${err}`, {
        status: 500,
        headers: cors,
      });
    }

    const data = await r.json();

    let text = "";
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === "output_text" && typeof c.text === "string") {
              text += c.text;
            }
          }
        }
      }
    }

    return new Response(text || "(Tomt svar)", {
      headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
