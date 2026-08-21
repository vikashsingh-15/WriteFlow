import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import Connection from "./db/db.js";
import { getDocument, updateDocument } from "./controller/documentController.js";
import aiRouter from "./routes/aiRoutes.js";
import documentRouter from "./routes/documentRoutes.js";

dotenv.config();

const PORT = Number(process.env.PORT || 9000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientBuildPath = path.resolve(__dirname, "../client/build");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});
const rooms = new Map();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: "2mb" }));
app.get("/api/health", (_request, response) => response.json({ ok: true }));
app.use("/api/ai", aiRouter);
app.use("/api/documents", documentRouter);
app.use(express.static(clientBuildPath));
app.get("/{*splat}", (_request, response) => response.sendFile(path.join(clientBuildPath, "index.html")));

function colorFor(id) {
  const palette = ["#4f46e5", "#0891b2", "#16a34a", "#d97706", "#db2777", "#7c3aed"];
  return palette[[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palette.length];
}

function publishPresence(documentId) {
  if (!documentId) return;
  const users = Array.from(rooms.get(documentId)?.values() || []);
  io.to(documentId).emit("presence", users);
}

function leaveDocument(socket) {
  const documentId = socket.data.documentId;
  if (!documentId) return;
  socket.leave(documentId);
  const members = rooms.get(documentId);
  members?.delete(socket.id);
  if (members?.size === 0) rooms.delete(documentId);
  socket.data.documentId = null;
  publishPresence(documentId);
}

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId, profile = {}) => {
    try {
      if (!documentId) throw new Error("Document ID is required");
      leaveDocument(socket);
      const document = await getDocument(documentId);
      socket.data.documentId = documentId;
      socket.join(documentId);
      if (!rooms.has(documentId)) rooms.set(documentId, new Map());
      rooms.get(documentId).set(socket.id, {
        id: socket.id,
        name: String(profile.name || "Anonymous writer").slice(0, 40),
        color: colorFor(socket.id),
      });
      socket.emit("load-document", { data: document.data, title: document.title, titleIsCustom: document.titleIsCustom });
      publishPresence(documentId);
    } catch (error) {
      socket.emit("document-error", error.message);
    }
  });

  socket.on("send-changes", (content) => {
    const documentId = socket.data.documentId;
    if (documentId && typeof content === "string") socket.to(documentId).emit("receive-changes", content);
  });

  socket.on("save-document", async (content, acknowledge = () => {}) => {
    try {
      const documentId = socket.data.documentId;
      if (!documentId) throw new Error("Join a document before saving");
      const document = await updateDocument(documentId, content);
      acknowledge({ ok: true, title: document.title });
    } catch (error) {
      acknowledge({ ok: false, error: error.message });
    }
  });

  socket.on("leave-document", () => leaveDocument(socket));
  socket.on("disconnect", () => leaveDocument(socket));
});

async function start() {
  await Connection();
  server.listen(PORT, () => console.log(`WriteFlow server listening on port ${PORT}`));
}

start().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
