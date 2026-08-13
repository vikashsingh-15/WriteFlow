import { useEffect, useState } from "react";

export default function TableOfContents({ editor }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!editor) return undefined;
    const update = () => {
      const headings = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") headings.push({ level: node.attrs.level, text: node.textContent, pos });
      });
      setItems(headings);
    };
    update();
    editor.on("update", update);
    return () => editor.off("update", update);
  }, [editor]);
  return <aside className="document-outline"><h3>Outline</h3>{items.length === 0 ? <p>Add headings to build an outline.</p> : items.map((item, index) => <button key={`${item.pos}-${index}`} style={{ paddingLeft: `${(item.level - 1) * 14}px` }} onClick={() => editor.chain().focus().setTextSelection(item.pos + 1).scrollIntoView().run()}>{item.text || "Untitled heading"}</button>)}</aside>;
}
