const prompts = {
  autocomplete: ({ context }) => `Continue the following writing naturally. Return only the continuation, no quotation marks or commentary.\n\n${context}`,
  improve: ({ text }) => `Improve the clarity, grammar, and flow of this text while preserving its meaning. Return only the revised text.\n\n${text}`,
  rephrase: ({ text }) => `Rephrase this text without changing its meaning. Return only the rewritten text.\n\n${text}`,
  translate: ({ text, language }) => `Translate this text into ${language || "French"}. Return only the translation.\n\n${text}`,
};

export async function runEditorAI(action, payload) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    const error = new Error("AI editing is not configured. Add CEREBRAS_API_KEY to server/.env.");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }
  const prompt = prompts[action]?.(payload);
  if (!prompt || (!payload.text && !payload.context)) throw new Error("Text or editor context is required");
  const response = await fetch(process.env.AI_API_URL || "https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35,
      max_tokens: 700,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerMessage = data?.error?.message || data?.message || data?.detail;
    throw new Error(providerMessage || `AI provider returned ${response.status} for ${response.url}`);
  }
  const result = data?.choices?.[0]?.message?.content?.trim();
  if (!result) throw new Error("AI provider returned an empty response");
  return result;
}
