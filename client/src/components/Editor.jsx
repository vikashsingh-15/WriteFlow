// import { useEffect, useRef, useState } from "react";
// import Quill from "quill";
// import "quill/dist/quill.snow.css";
// import { Box } from "@mui/material";
// import styled from "@emotion/styled";
// import { io } from "socket.io-client";
// import { useParams } from "react-router-dom";

// const Components = styled.div`
//   background-color: #f5f5f5;
//   height: 100vh;
// `;

// const toolbarOptions = [
//   ["bold", "italic", "underline", "strike"],
//   ["blockquote", "code-block"],
//   ["link", "image", "video", "formula"],

//   [{ header: 1 }, { header: 2 }],
//   [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
//   [{ script: "sub" }, { script: "super" }],
//   [{ indent: "-1" }, { indent: "+1" }],
//   [{ direction: "rtl" }],

//   [{ size: ["small", false, "large", "huge"] }],
//   [{ header: [1, 2, 3, 4, 5, 6, false] }],

//   [{ color: [] }, { background: [] }],
//   [{ font: [] }],
//   [{ align: [] }],

//   ["clean"],
// ];

// const Editor = () => {
//   const wrapperRef = useRef(null);
//   const [socket, setSocket] = useState(null);
//   const [quill, setQuill] = useState(null);
//   const { id } = useParams();

//   // Socket initialization
//   useEffect(() => {
//     const socketServer = io(process.env.REACT_APP_SOCKET_URL);
//     setSocket(socketServer);

//     return () => {
//       socketServer.disconnect();
//     };
//     console.log("Socket initialized");
//   }, []);

//   // Quill initialization
//   useEffect(() => {
//     if (wrapperRef.current == null) return;

//     const editor = document.createElement("div");
//     wrapperRef.current.innerHTML = ""; // Clear existing
//     wrapperRef.current.append(editor);

//     const quillServer = new Quill(editor, {
//       theme: "snow",
//       modules: { toolbar: toolbarOptions },
//     });
//     quillServer.disable();
//     quillServer.setText("Loading...");
//     setQuill(quillServer);
//   }, []);

//   // Socket event handling
//   useEffect(() => {
//     if (socket == null || quill == null) return;

//     const handleChange = (delta, oldDelta, source) => {
//       if (source !== "user") return;
//       socket.emit("send-changes", delta);
//     };

//     quill.on("text-change", handleChange);

//     return () => {
//       quill.off("text-change", handleChange);
//     };
//   }, [socket, quill]);

//   useEffect(() => {
//     if (socket == null || quill == null) return;

//     const handleReceive = (delta) => {
//       quill.updateContents(delta);
//     };

//     socket && socket.on("receive-changes", handleReceive);

//     return () => {
//       socket && socket.off("receive-changes", handleReceive);
//     };
//   }, [socket, quill]);

//   useEffect(() => {
//     if (socket == null || quill == null) return;

//     socket.once("load-document", (document) => {
//       quill && quill.setContents(document);
//       quill.enable();
//     });

//     socket && socket.emit("get-document", id);

//     return () => {
//       socket.emit("leave-room", id);
//     };
//   }, [socket, id, quill]);

//   useEffect(() => {
//     if (socket == null || quill == null) return;

//     setInterval(() => {
//       socket.emit("save-document", quill.getContents());
//     }, 2000);

//     return () => {
//       clearInterval();
//     };
//   }, [socket, quill]);

//   return (
//     <Components>
//       <Box ref={wrapperRef} style={{ height: "100%", padding: "16px" }} />
//     </Components>
//   );
// };

// export default Editor;

//------------

import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { Box } from "@mui/material";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const Components = styled.div`
  background-color: #f5f5f5;
  height: 100vh;
`;

const toolbarOptions = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  ["link", "image", "video", "formula"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const Editor = () => {
  const wrapperRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const { id } = useParams();

  // ✅ Initialize Socket
  useEffect(() => {
    const socketServer = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(socketServer);
    console.log(
      "Socket initialized with URL:",
      process.env.REACT_APP_SOCKET_URL
    );

    return () => {
      socketServer.disconnect();
      console.log("Socket disconnected.");
    };
  }, []);

  // ✅ Initialize Quill
  useEffect(() => {
    if (!wrapperRef.current) return;

    const editor = document.createElement("div");
    wrapperRef.current.innerHTML = "";
    wrapperRef.current.append(editor);

    const quillInstance = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
    });

    quillInstance.disable();
    quillInstance.setText("Loading...");
    setQuill(quillInstance);
    console.log("Quill editor initialized.");
  }, []);

  // ✅ Text changes → Emit to server
  useEffect(() => {
    if (!socket || !quill) return;

    const handleChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handleChange);
    console.log("Listening to text changes.");

    return () => {
      quill.off("text-change", handleChange);
    };
  }, [socket, quill]);

  // ✅ Receive changes from other clients
  useEffect(() => {
    if (!socket || !quill) return;

    const handleReceive = (delta) => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handleReceive);
    console.log("Listening for received changes.");

    return () => {
      socket.off("receive-changes", handleReceive);
    };
  }, [socket, quill]);

  // ✅ Load initial document content
  useEffect(() => {
    if (!socket || !quill) return;

    socket.once("load-document", (document) => {
      console.log("Document loaded from backend:", document);
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", id);
    console.log("Requested document with ID:", id);

    return () => {
      socket.emit("leave-room", id);
      console.log("Left room:", id);
    };
  }, [socket, quill, id]);

  // ✅ Auto-save every 2 seconds
  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      const content = quill.getContents();
      socket.emit("save-document", content);
      console.log("Document auto-saved.");
    }, 2000);

    return () => clearInterval(interval);
  }, [socket, quill]);

  return (
    <Components>
      <Box ref={wrapperRef} style={{ height: "100%", padding: "16px" }} />
    </Components>
  );
};

export default Editor;
