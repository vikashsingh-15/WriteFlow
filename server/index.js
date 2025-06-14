import { Server } from "socket.io";
import Connection from "./db/db.js";
import dotenv from "dotenv";
dotenv.config();
import {
  getDocument,
  updateDocument,
} from "./controller/documentController.js";

const PORT = process.env.PORT || 9000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Connect to MongoDB
Connection();

const io = new Server(PORT, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    // const data = "";
    const document = await getDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      try {
        await updateDocument(documentId, data);
      } catch (error) {
        console.error("Error saving document:", error);
      }
    });

    // socket.on("leave-room", () => {
    //   socket.leave(documentId);
    // });
  });
});
