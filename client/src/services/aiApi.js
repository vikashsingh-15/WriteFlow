const API_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_SOCKET_URL || "http://localhost:9000";

export async function requestAI(action, payload) {
  const response = await fetch(`${API_URL}/api/ai/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The AI request failed.");
  return data.result;
}
