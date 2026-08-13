import { Router } from "express";
import { deleteDocument, listDocuments, updateDocumentTitle } from "../controller/documentController.js";

const router = Router();

router.get("/", async (request, response) => {
  try {
    response.json({ documents: await listDocuments(request.query.q || "") });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

router.patch("/:id/title", async (request, response) => {
  try {
    const document = await updateDocumentTitle(request.params.id, request.body?.title);
    response.json({ document: { id: document.id, title: document.title, updatedAt: document.updatedAt } });
  } catch (error) {
    response.status(error.message === "Document not found" ? 404 : 400).json({ error: error.message });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const document = await deleteDocument(request.params.id);
    if (!document) return response.status(404).json({ error: "Document not found" });
    response.json({ ok: true });
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

export default router;
