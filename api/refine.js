export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    // ✅ Input check
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required" });
    }

    // ✅ API Key check
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API key missing" });
    }

    // ✅ Request to Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // stable model
        temperature: 0.2,
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: "Fix grammar and improve the sentence. Return only corrected text."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    // ✅ Safe JSON parse
    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(500).json({ error: "Invalid response from AI" });
    }

    // ❌ Handle API errors
    if (!response.ok) {
      console.error("Groq Error:", data);
      return res.status(500).json({
        error: data?.error?.message || "AI request failed"
      });
    }

    // ✅ Extract result
    const result =
      data?.choices?.[0]?.message?.content?.trim() || "No response";

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}
