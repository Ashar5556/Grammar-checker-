export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: "Text is required" });

    // LanguageTool API Call
    const response = await fetch("https://api.languagetool.org", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text, language: "en-US" })
    });

    if (!response.ok) throw new Error("LanguageTool API failed");

    const data = await response.json();
    let correctedText = text;

    if (data.matches && data.matches.length > 0) {
      data.matches.reverse().forEach(match => {
        if (match.replacements && match.replacements.length > 0) {
          const replacement = match.replacements[0].value;
          correctedText = correctedText.slice(0, match.offset) + replacement + correctedText.slice(match.offset + match.length);
        }
      });
    }

    return res.status(200).json({
      status: "connected",
      result: correctedText,
      server: "Vercel-Node"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
