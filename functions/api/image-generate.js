export async function onRequestPost(ctx) {
  try {
    const { prompt, size = "1024x1024", n = 1 } = await ctx.request.json();
    if (!prompt) return new Response(JSON.stringify({ error: "Prompt mancante" }), { status: 400 });

    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ctx.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ctx.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt,
        size,
        n: Math.min(Number(n) || 1, 4)
      })
    });

    if (!resp.ok) return new Response(await resp.text(), { status: resp.status });
    const data = await resp.json();
    const images = (data.data || []).map(d => d.b64_json);
    return new Response(JSON.stringify({ images }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
