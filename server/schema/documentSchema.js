import mongoose from "mongoose";

const documentSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});
const Document = mongoose.models.document || mongoose.model("document", documentSchema);
export default Document;
