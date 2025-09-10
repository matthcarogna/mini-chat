export async function onRequestPost(ctx) {
  try {
    const { prompt, image_b64, size = "1024x1024" } = await ctx.request.json();
    if (!prompt || !image_b64) {
      return new Response(JSON.stringify({ error: "Prompt o immagine mancante" }), { status: 400 });
    }

    // multipart/form-data per /v1/images/edits
    const boundary = "----cfboundary" + Math.random().toString(16).slice(2);
    const enc = (name, value, filename, contentType) => {
      let part = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"`;
      if (filename) part += `; filename="${filename}"`;
      part += `\r\n`;
      if (contentType) part += `Content-Type: ${contentType}\r\n`;
      part += `\r\n`;
      const header = new TextEncoder().encode(part);
      const footer = new TextEncoder().encode("\r\n");
      return { header, footer };
    };

    const bin = Uint8Array.from(atob(image_b64), c => c.charCodeAt(0));
    const chunks = [];
    let p = enc("model", "");
    chunks.push(p.header, new TextEncoder().encode("gpt-image-1"), p.footer);
    p = enc("prompt", "");  chunks.push(p.header, new TextEncoder().encode(prompt), p.footer);
    p = enc("size", "");    chunks.push(p.header, new TextEncoder().encode(size), p.footer);
    p = enc("image", "", "image.png", "image/png");
    chunks.push(p.header, bin, p.footer);
    chunks.push(new TextEncoder().encode(`--${boundary}--\r\n`));

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${ctx.env.OPENAI_API_KEY}`, "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body: new Blob(chunks)
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: err }), { status: resp.status });
    }
    const data = await resp.json();
    const images = (data.data || []).map(d => d.b64_json);
    return new Response(JSON.stringify({ images }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
