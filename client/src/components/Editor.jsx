import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import EditorToolbar from "./editor/EditorToolbar";
import SelectionMenu from "./editor/SelectionMenu";
import TableOfContents from "./editor/TableOfContents";
import { requestAI } from "../services/aiApi";
import { saveDocumentTitle } from "../services/documentApi";
import { Autocomplete } from "./editor/extensions/Autocomplete";

const EMPTY_DOCUMENT = "<p></p>";

function toHtml(content) {
  if (typeof content === "string") return content || EMPTY_DOCUMENT;
  if (content?.ops) {
    const text = content.ops.map((op) => (typeof op.insert === "string" ? op.insert : "")).join("");
    return `<p>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("\n", "</p><p>")}</p>`;
  }
  return EMPTY_DOCUMENT;
}

export default function Editor() {
  const { id } = useParams();
  const socketUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:9000";
  const socket = useMemo(() => io(socketUrl, { autoConnect: false }), [socketUrl]);
  const applyingRemoteChange = useRef(false);
  const saveTimer = useRef(null);
  const slashCommandRunning = useRef(false);
  const titleIsCustom = useRef(false);
  const titleRef = useRef("Untitled document");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("Loading…");
  const [users, setUsers] = useState([]);
  const [showOutline, setShowOutline] = useState(false);
  const [aiBusy, setAiBusy] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Untitled document");
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(() => window.localStorage.getItem("writeflow-autocomplete") === "true");
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("writeflow-theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    window.localStorage.setItem("writeflow-theme", theme);
  }, [theme]);

  useEffect(() => { titleRef.current = title; }, [title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Start writing your document…" }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Autocomplete.configure({
        delay: 1400,
        fetchSuggestion: (context) => requestAI("autocomplete", { context: `Document title: ${titleRef.current}\n\n${context}` }),
      }),
    ],
    content: EMPTY_DOCUMENT,
    editable: false,
    onUpdate: ({ editor: currentEditor }) => {
      if (applyingRemoteChange.current || !loaded) return;
      const content = currentEditor.getHTML();
      socket.emit("send-changes", content);
      setSaveState("Unsaved");
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        socket.emit("save-document", content, (result) => {
          setSaveState(result?.ok ? "Saved" : "Save failed");
          if (result?.title && !titleIsCustom.current) setTitle(result.title);
          if (!result?.ok) setError(result?.error || "Could not save the document.");
        });
      }, 900);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setAutocompleteEnabled(autocompleteEnabled);
    window.localStorage.setItem("writeflow-autocomplete", String(autocompleteEnabled));
  }, [autocompleteEnabled, editor]);

  useEffect(() => {
    if (!editor) return undefined;
    socket.connect();

    const loadDocument = (document) => {
      applyingRemoteChange.current = true;
      editor.commands.setContent(toHtml(document?.data ?? document), false);
      applyingRemoteChange.current = false;
      setTitle(document?.title || "Untitled document");
      titleIsCustom.current = Boolean(document?.titleIsCustom);
      editor.setEditable(true);
      setLoaded(true);
      setSaveState("Saved");
    };
    const receiveChanges = (content) => {
      applyingRemoteChange.current = true;
      editor.commands.setContent(toHtml(content), false);
      applyingRemoteChange.current = false;
    };
    const presence = (connectedUsers) => setUsers(connectedUsers || []);
    const serverError = (message) => setError(message || "A server error occurred.");

    socket.on("load-document", loadDocument);
    socket.on("receive-changes", receiveChanges);
    socket.on("presence", presence);
    socket.on("document-error", serverError);
    socket.emit("get-document", id, {
      name: `Writer ${Math.floor(Math.random() * 900 + 100)}`,
    });

    return () => {
      window.clearTimeout(saveTimer.current);
      socket.emit("leave-document");
      socket.off("load-document", loadDocument);
      socket.off("receive-changes", receiveChanges);
      socket.off("presence", presence);
      socket.off("document-error", serverError);
      socket.disconnect();
    };
  }, [editor, id, socket]);

  const commitTitle = useCallback(async () => {
    try {
      titleIsCustom.current = Boolean(title.trim());
      const data = await saveDocumentTitle(id, title);
      setTitle(data.document.title);
    } catch (titleError) {
      setError(titleError.message);
    }
  }, [id, title]);

  const runAI = useCallback(async (action, options = {}) => {
    if (!editor || aiBusy) return;
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");
    const usesWholeDocument = action === "summarize" || action === "faq";
    if (action !== "autocomplete" && !usesWholeDocument && !selectedText) {
      setError("Select some text before using an AI editing action.");
      return;
    }
    setError("");
    setAiBusy(action);
    try {
      const result = await requestAI(action, {
        text: usesWholeDocument ? editor.getText() : selectedText,
        context: editor.getText().slice(Math.max(0, from - 2000), from),
        language: options.language,
      });
      if (usesWholeDocument) {
        const bodyNodes = result.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => ({
          type: "paragraph",
          content: [{ type: "text", text: line }],
        }));
        editor.chain().focus("end").insertContent([
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: action === "faq" ? "Frequently Asked Questions" : "Summary" }] },
          ...bodyNodes,
        ]).run();
      } else if (action === "autocomplete") {
        editor.chain().focus().splitBlock().insertContent(result).run();
      } else {
        editor.chain().focus().insertContentAt({ from, to }, result).run();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAiBusy("");
    }
  }, [aiBusy, editor]);

  useEffect(() => {
    if (!editor) return undefined;
    const handleSlashCommand = () => {
      if (slashCommandRunning.current || aiBusy) return;
      let command = null;
      editor.state.doc.descendants((node, pos) => {
        const value = node.textContent.trim();
        const action = /^\/{3}summari[sz]e$/i.test(value) ? "summarize" : /^\/{3}faq$/i.test(value) ? "faq" : null;
        if (node.isTextblock && action) {
          command = { action, from: pos, to: pos + node.nodeSize };
          return false;
        }
        return true;
      });
      if (!command) return;
      slashCommandRunning.current = true;
      editor.chain().deleteRange({ from: command.from, to: command.to }).run();
      runAI(command.action).finally(() => { slashCommandRunning.current = false; });
    };
    editor.on("update", handleSlashCommand);
    return () => editor.off("update", handleSlashCommand);
  }, [aiBusy, editor, runAI]);

  return (
    <main className={`workspace-shell ${theme === "dark" ? "dark-theme" : "light-theme"}`}>
      <header className="document-header">
        <div>
          <span className="brand">WriteFlow</span>
          <span className={`save-state ${saveState === "Save failed" ? "error" : ""}`}>{saveState}</span>
        </div>
        <input className="document-title-input" aria-label="Document title" value={title} onChange={(event) => { titleIsCustom.current = true; setTitle(event.target.value); }} onBlur={commitTitle} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        <div className="header-actions">
          <button className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "day" : "night"} theme`} onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}{theme === "dark" ? "Day" : "Night"}
          </button>
          <button className="outline-toggle" onClick={() => setShowOutline((value) => !value)}>
            {showOutline ? "Hide outline" : "Show outline"}
          </button>
        </div>
      </header>

      {error && <div className="editor-alert" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}

      <section className="editor-layout">
        <div className="editor-column">
          {editor && <SelectionMenu editor={editor} onAI={runAI} busy={aiBusy} />}
          <EditorContent editor={editor} className="editor-page" />
        </div>
        {showOutline && <TableOfContents editor={editor} />}
      </section>

      <EditorToolbar
        editor={editor}
        users={users}
        saveState={saveState}
        busy={aiBusy}
        autocompleteEnabled={autocompleteEnabled}
        onToggleAutocomplete={() => setAutocompleteEnabled((value) => !value)}
        onAI={runAI}
        onSave={() => {
          if (!editor) return;
          setSaveState("Saving…");
          socket.emit("save-document", editor.getHTML(), (result) => {
            setSaveState(result?.ok ? "Saved" : "Save failed");
            if (result?.title && !titleIsCustom.current) setTitle(result.title);
          });
        }}
      />
    </main>
  );
}
