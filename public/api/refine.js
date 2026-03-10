export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { text } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount > 600) {
      return res.status(400).json({ error: "Maximum 600 words allowed" });
    }

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

    const data = await response.json();

    let correctedText = text;

    data.matches.reverse().forEach(match => {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value;

        correctedText =
          correctedText.slice(0, match.offset) +
          replacement +
          correctedText.slice(match.offset + match.length);
      }
    });

    return res.status(200).json({
      status: "connected",
      result: correctedText
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "Server error"
    });

  }
  }
