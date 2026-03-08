export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;

  // FIX: body parsing for Vercel
  if (typeof body === "string") {
    body = JSON.parse(body);
  }

  if (!body || !body.text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const { text } = body;

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

      // -------- SERVER 2 : LANGUAGETOOL --------
      const lt = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          text: text,
          language: "en-US"
        })
      });

      const data = await lt.json();

      let correctedText = text;

      // Apply corrections
      data.matches.reverse().forEach(match => {
        if (match.replacements.length > 0) {
          const replacement = match.replacements[0].value;

          correctedText =
            correctedText.slice(0, match.offset) +
            replacement +
            correctedText.slice(match.offset + match.length);
        }
      });

      return res.status(200).json({
        server: "Fallback Server (LanguageTool)",
        result: correctedText
      });

    } catch (err) {

      return res.status(500).json({
        error: "Both servers failed"
      });

    }

  }

          }
