// import { Server } from "socket.io";
// import Connection from "./db/db.js";
// import dotenv from "dotenv";
// dotenv.config();
// import {
//   getDocument,
//   updateDocument,
// } from "./controller/documentController.js";

// const PORT = process.env.PORT || 9000;
// const CLIENT_URL = process.env.CLIENT_URL;

// // Connect to MongoDB
// Connection();

// const io = new Server(PORT, {
//   cors: {
//     origin: CLIENT_URL,
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   socket.on("get-document", async (documentId) => {
//     // const data = "";
//     const document = await getDocument(documentId);
//     socket.join(documentId);
//     socket.emit("load-document", document.data);

//     socket.on("send-changes", (delta) => {
//       socket.broadcast.to(documentId).emit("receive-changes", delta);
//     });

//     socket.on("save-document", async (data) => {
//       try {
//         await updateDocument(documentId, data);
//       } catch (error) {
//         console.error("Error saving document:", error);
//       }
//     });

//     // socket.on("leave-room", () => {
//     //   socket.leave(documentId);
//     // });
//   });
// });

///----

import { Server } from "socket.io";
import Connection from "./db/db.js";
import dotenv from "dotenv";
dotenv.config();
import {
  getDocument,
  updateDocument,
} from "./controller/documentController.js";

const PORT = process.env.PORT || 9000;
const CLIENT_URL = process.env.CLIENT_URL;

// Connect to MongoDB
Connection();

const io = new Server(PORT, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 New client connected");

  socket.on("get-document", async (documentId) => {
    console.log(`📄 get-document event received for ID: ${documentId}`);

    const document = await getDocument(documentId);

    if (!document) {
      console.warn(`⚠️ No document found for ID: ${documentId}`);
      return socket.emit("load-document", { ops: [] });
    }

    socket.join(documentId);
    console.log(`✅ Joined room for document: ${documentId}`);

    socket.emit("load-document", document.data);
    console.log(`📤 Sent document data to client for ID: ${documentId}`);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
      console.log(`🔄 Changes broadcasted for document ID: ${documentId}`);
    });

    socket.on("save-document", async (data) => {
      try {
        await updateDocument(documentId, data);
        console.log(`💾 Document ID ${documentId} saved to database`);
      } catch (error) {
        console.error("❌ Error saving document:", error);
      }
    });

    // Optional disconnect event for cleanup/debugging
    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected from document ID: ${documentId}`);
    });
  });
});
