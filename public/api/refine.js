export default async function handler(req, res) {
  // Allow CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse request body
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    // Check if text exists
    if (!body || !body.text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const { text } = body;

    // Word count check
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 600) {
      return res.status(400).json({
        error: "Maximum 600 words allowed"
      });
    }

    // -------- LANGUAGETOOL API CALL --------
    const ltResponse = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        text: text,
        language: "en-US",
        enabledOnly: "false",
        level: "picky"  // For more suggestions
      })
    });

    if (!ltResponse.ok) {
      throw new Error("LanguageTool API failed");
    }

    const ltData = await ltResponse.json();
    let correctedText = text;

    // Apply corrections (from last to first to maintain positions)
    ltData.matches.reverse().forEach(match => {
      if (match.replacements && match.replacements.length > 0) {
        const replacement = match.replacements[0].value;
        
        correctedText =
          correctedText.slice(0, match.offset) +
          replacement +
          correctedText.slice(match.offset + match.length);
      }
    });

    // Return the corrected text
    return res.status(200).json({
      server: "LanguageTool",
      result: correctedText
    });

  } catch (error) {
    console.error("LanguageTool Error:", error);
    
    return res.status(500).json({ 
      error: "Server error: " + (error.message || "Unknown error")
    });
  }
}
