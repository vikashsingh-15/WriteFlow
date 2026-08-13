import { useState } from "react";
import {
  Bold, Italic, Underline, Highlighter, Undo2, Redo2, Link as LinkIcon,
  Image, Table2, Code2, Quote, Save, Sparkles, Users,
} from "lucide-react";

function ToolButton({ title, active, disabled, onClick, children }) {
  return <button type="button" title={title} aria-label={title} className={`tool-button ${active ? "active" : ""}`} disabled={disabled} onClick={onClick}>{children}</button>;
}

export default function EditorToolbar({ editor, users, saveState, busy, onAI, onSave }) {
  const [showUsers, setShowUsers] = useState(false);
  if (!editor) return null;
  const addLink = () => {
    const previous = editor.getAttributes("link").href || "https://";
    const url = window.prompt("Link URL", previous);
    if (url === null) return;
    if (!url) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const addImage = () => {
    const url = window.prompt("Image URL", "https://");
    if (url && url !== "https://") editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <footer className="editor-toolbar">
      <div className="toolbar-group">
        <select aria-label="Text style" value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"} onChange={(event) => {
          const value = event.target.value;
          if (value === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) }).run();
        }}>
          <option value="p">Text</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <ToolButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolButton>
        <ToolButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolButton>
        <ToolButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></ToolButton>
        <ToolButton title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()}><Highlighter /></ToolButton>
        <ToolButton title="Link" active={editor.isActive("link")} onClick={addLink}><LinkIcon /></ToolButton>
        <ToolButton title="Image" onClick={addImage}><Image /></ToolButton>
        <ToolButton title="Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 /></ToolButton>
        <ToolButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 /></ToolButton>
        <ToolButton title="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolButton>
        <ToolButton title="Continue writing with AI" disabled={Boolean(busy)} onClick={() => onAI("autocomplete")}><Sparkles /></ToolButton>
      </div>
      <div className="toolbar-group toolbar-meta">
        <span>{editor.storage.characterCount.words()} words</span>
        <ToolButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></ToolButton>
        <ToolButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></ToolButton>
        <ToolButton title={saveState} onClick={onSave}><Save /></ToolButton>
        <div className="presence-wrap">
          <ToolButton title="Connected writers" onClick={() => setShowUsers((value) => !value)}><Users /><b>{users.length}</b></ToolButton>
          {showUsers && <div className="presence-popover"><strong>Connected writers</strong>{users.map((user) => <div key={user.id}><span style={{ background: user.color }} />{user.name}</div>)}</div>}
        </div>
      </div>
    </footer>
  );
}
