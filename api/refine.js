try {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error("Groq failed");
  }

  return res.status(200).json({
    server: "AI Server (Groq)",
    result: data.choices?.[0]?.message?.content?.trim() || "No response"
  });

} catch (error) {
  console.error("Error:", error);

  return res.status(500).json({
    error: "Something went wrong"
  });
}
