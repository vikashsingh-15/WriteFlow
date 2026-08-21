const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

const prompts = {
  autocomplete: ({ context }) => `Continue the following writing naturally. Return only the continuation, no quotation marks or commentary.\n\n${context}`,
  improve: ({ text }) => `Improve the clarity, grammar, and flow of this text while preserving its meaning. Return only the revised text.\n\n${text}`,
  rephrase: ({ text }) => `Rephrase this text without changing its meaning. Return only the rewritten text.\n\n${text}`,
  translate: ({ text, language }) => `Translate this text into ${language || "French"}. Return only the translation.\n\n${text}`,
  summarize: ({ text }) => `Summarize the following document clearly and concisely. Preserve the key facts and conclusions. Return only the summary, without a heading or commentary.\n\n${text}`,
  faq: ({ text }) => `Create a useful FAQ from the following document. Include the most important questions a reader may ask and concise, accurate answers. Format every item exactly as "Q: question" followed by "A: answer", with a blank line between items. Return only the FAQ items, without an introductory heading.\n\n${text}`,
};

function getOpenRouterConfig() {
  // Cerebras config kept for reference only:
  // const apiKey = process.env.CEREBRAS_API_KEY;
  // const apiUrl = "https://api.cerebras.ai/v1/chat/completions";
  // const model = "gpt-oss-120b";
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    apiUrl: process.env.AI_API_URL || OPENROUTER_API_URL,
    model: process.env.AI_MODEL || DEFAULT_OPENROUTER_MODEL,
    siteUrl: process.env.CLIENT_URL || "http://localhost:3000",
    appTitle: process.env.OPENROUTER_APP_TITLE || "WriteFlow",
  };
}

async function callLLM(prompt) {
  const { apiKey, apiUrl, model, siteUrl, appTitle } = getOpenRouterConfig();

  if (!apiKey) {
    const error = new Error("AI editing is not configured. Add OPENROUTER_API_KEY to server/.env.");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": appTitle,
    },
    body: JSON.stringify({
      model,
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

export async function runEditorAI(action, payload) {
  const prompt = prompts[action]?.(payload);
  if (!prompt || (!payload.text && !payload.context)) throw new Error("Text or editor context is required");
  return callLLM(prompt);
}

