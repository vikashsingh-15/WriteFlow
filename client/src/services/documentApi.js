const API_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_SOCKET_URL || (process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:9000");

async function request(path, options) {
  const response = await fetch(`${API_URL}/api/documents${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Document request failed");
  return data;
}

export const saveDocumentTitle = (id, title) => request(`/${id}/title`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title }),
});
