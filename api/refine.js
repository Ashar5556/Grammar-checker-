export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {

    const { text } = req.body || {};

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Word limit safety
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 600) {
      return res.status(400).json({ error: "Maximum 600 words allowed" });
    }

    // LanguageTool API call
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        text: text,
        language: "en-US"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error("LanguageTool API error: " + errText);
    }

    const data = await response.json();

    let correctedText = text;

    if (data.matches && data.matches.length > 0) {

      // Reverse apply corrections
      const matches = [...data.matches].reverse();

      for (const match of matches) {

        if (match.replacements && match.replacements.length > 0) {

          const replacement = match.replacements[0].value;

          correctedText =
            correctedText.slice(0, match.offset) +
            replacement +
            correctedText.slice(match.offset + match.length);

        }

      }

    }

    return res.status(200).json({
      status: "connected",
      original: text,
      result: correctedText,
      corrections: data.matches.length,
      server: "Vercel Node.js"
    });

  } catch (error) {

    console.error("API ERROR:", error);

    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message
    });

  }
}
