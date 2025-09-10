export async function onRequestPost(ctx) {
  try {
    const { history = [] } = await ctx.request.json();
    const messages = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.text || '' }));

    messages.unshift({
      role: "system",
      content: "Sei un assistente conciso e pratico. Rispondi in italiano, tono informale."
    });

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ctx.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ctx.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
        messages,
        temperature: 0.7
      })
    });

    if (!resp.ok) return new Response(await resp.text(), { status: resp.status });
    const data = await resp.json();
    const out = data.choices?.[0]?.message?.content || "Ok.";
    return new Response(JSON.stringify({ output: out }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
