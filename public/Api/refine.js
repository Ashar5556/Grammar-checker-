export default async function handler(req, res) {

  const { text } = req.body;

  // 600 WORD LIMIT
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 600) {
    return res.status(400).json({
      error: "Maximum 600 words allowed"
    });
  }

  const prompt = `You are an expert English editor.

Refine the following text:
- Correct grammar, spelling, and punctuation.
- Make the writing sound natural and human-like.
- Keep the text engaging for online readers.
- Preserve the original sentence structure and flow.
- Do not perform a full rewrite or significantly change sentence order.
- Preserve the original meaning.
- Remove only redundancy or awkward phrasing if absolutely necessary.

Output only the final polished text.

Text to refine:
${text}`;

  try {
    // Groq API (Server 1)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) throw new Error("Groq failed");

    const data = await response.json();

    return res.status(200).json({
      server: 1,
      result: data.choices[0].message.content
    });

  } catch (error) {
    // LanguageTool fallback (Server 2)
    const lt = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        text: text,
        language: "en-US"
      })
    });

    const data = await lt.json();

    return res.status(200).json({
      server: 2,
      result: text
    });
  }

}
