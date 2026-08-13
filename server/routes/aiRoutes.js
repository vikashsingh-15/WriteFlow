import { Router } from "express";
import { runEditorAI } from "../services/aiService.js";

const router = Router();
const supportedActions = new Set(["autocomplete", "improve", "rephrase", "translate", "summarize"]);

router.post("/:action", async (request, response) => {
  try {
    const { action } = request.params;
    if (!supportedActions.has(action)) return response.status(404).json({ error: "Unknown AI action" });
    const result = await runEditorAI(action, request.body || {});
    response.json({ result });
  } catch (error) {
    const status = error.code === "AI_NOT_CONFIGURED" ? 503 : 500;
    response.status(status).json({ error: error.message || "AI request failed" });
  }
});

export default router;
