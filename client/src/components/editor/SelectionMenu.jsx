import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Underline, Sparkles, Languages, WandSparkles } from "lucide-react";

export default function SelectionMenu({ editor, onAI, busy }) {
  if (!editor) return null;
  return (
    <BubbleMenu editor={editor} className="selection-menu">
      <button aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></button>
      <button aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></button>
      <button aria-label="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></button>
      <span />
      <button disabled={Boolean(busy)} onClick={() => onAI("improve")}><WandSparkles /> Improve</button>
      <button disabled={Boolean(busy)} onClick={() => onAI("rephrase")}><Sparkles /> Rephrase</button>
      <button disabled={Boolean(busy)} onClick={() => onAI("translate", { language: "French" })}><Languages /> French</button>
    </BubbleMenu>
  );
}
