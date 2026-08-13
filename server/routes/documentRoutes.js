import { Router } from "express";
import { updateDocumentTitle } from "../controller/documentController.js";

const router = Router();

router.patch("/:id/title", async (request, response) => {
  try {
    const document = await updateDocumentTitle(request.params.id, request.body?.title);
    response.json({ document: { id: document.id, title: document.title, updatedAt: document.updatedAt } });
  } catch (error) {
    response.status(error.message === "Document not found" ? 404 : 400).json({ error: error.message });
  }
});

export default router;
