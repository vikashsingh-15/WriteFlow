import Document from "../schema/documentSchema.js";

export const getDocument = async (id) => {
  if (!id) {
    throw new Error("Document ID is required");
  }

  const document = await Document.findById(id);

  if (document) {
    return document;
  }

  return await Document.create({
    _id: id,
    data: "<p></p>",
  });
};

export const updateDocument = async (id, data) => {
  if (!id || typeof data !== "string") {
    throw new Error("Document ID and data are required");
  }

  const document = await Document.findByIdAndUpdate(id, { data }, { new: true, runValidators: true });
  return document;
};
