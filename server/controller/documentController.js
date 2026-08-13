import Document from "../schema/documentSchema.js";

const stripHtml = (html = "") => String(html)
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .trim();

export const deriveTitle = (data) => {
  const words = stripHtml(data).split(" ").filter(Boolean).slice(0, 6);
  return words.join(" ").slice(0, 120) || "Untitled document";
};

export const getDocument = async (id) => {
  if (!id) {
    throw new Error("Document ID is required");
  }

  const document = await Document.findById(id);

  if (document) {
    if (!document.title) {
      document.title = deriveTitle(document.data);
      await document.save();
    }
    return document;
  }

  return await Document.create({
    _id: id,
    data: "<p></p>",
    title: "Untitled document",
  });
};

export const updateDocument = async (id, data) => {
  if (!id || typeof data !== "string") {
    throw new Error("Document ID and data are required");
  }

  const existing = await Document.findById(id);
  const update = { data };
  if (!existing?.titleIsCustom) update.title = deriveTitle(data);
  const document = await Document.findByIdAndUpdate(id, update, { new: true, upsert: true, runValidators: true });
  return document;
};

export const updateDocumentTitle = async (id, title) => {
  if (!id) throw new Error("Document ID is required");
  const cleanTitle = String(title || "").trim().slice(0, 120);
  const document = await Document.findById(id);
  if (!document) throw new Error("Document not found");
  document.title = cleanTitle || deriveTitle(document.data);
  document.titleIsCustom = Boolean(cleanTitle);
  await document.save();
  return document;
};
