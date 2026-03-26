export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!req.body || !req.body.text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const { text } = req.body;

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount > 600) {
    return res.status(400).json({
      error: "Maximum 600 words allowed"
    });
  }

  const prompt = `You are an expert English editor.

Correct grammar, spelling, and punctuation in the text below.
Improve clarity and readability while keeping the original meaning.
Do not rewrite the text completely and do not add explanations.

Return only the corrected text.

Text:
${text}`;

  try {

    // -------- SERVER 1 : GROQ AI --------
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 900,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error("Groq failed");

    const data = await response.json();

    return res.status(200).json({
      server: "AI Server (Groq)",
      result: data.choices[0].message.content.trim()
    });

  } catch (error) {

    try {

      });

    }

  }

          }
