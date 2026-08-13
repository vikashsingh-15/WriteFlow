import { useEffect, useState } from "react";
import { FilePlus2, FileText, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { deleteDocument, getDocuments } from "../../services/documentApi";

export default function DocumentSidebar({ currentId, refreshKey }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listVersion, setListVersion] = useState(0);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [deleteState, setDeleteState] = useState({ loading: false, error: "" });

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getDocuments(query);
        setDocuments(data.documents || []);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query, refreshKey, listVersion]);

  const removeDocument = async () => {
    if (!documentToDelete) return;
    setDeleteState({ loading: true, error: "" });
    try {
      await deleteDocument(documentToDelete._id);
      const deletedCurrentDocument = documentToDelete._id === currentId;
      setDocumentToDelete(null);
      setDeleteState({ loading: false, error: "" });
      if (deletedCurrentDocument) navigate(`/${uuid()}`);
      else setListVersion((value) => value + 1);
    } catch (error) {
      setDeleteState({ loading: false, error: error.message });
    }
  };

  return <aside className="document-sidebar">
    <button className="new-document" onClick={() => navigate(`/${uuid()}`)}><FilePlus2 />New document</button>
    <label className="document-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" /></label>
    <div className="document-list">
      {loading && <p>Loading documents...</p>}
      {!loading && documents.length === 0 && <p>No documents found.</p>}
      {documents.map((document) => <div key={document._id} className={`document-list-item ${document._id === currentId ? "active" : ""}`} onClick={() => navigate(`/${document._id}`)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") navigate(`/${document._id}`); }}>
        <FileText /><span><strong>{document.title || "Untitled document"}</strong><small>{document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : ""}</small></span>
        <button className="delete-document" aria-label={`Delete ${document.title || "document"}`} onClick={(event) => { event.stopPropagation(); setDeleteState({ loading: false, error: "" }); setDocumentToDelete(document); }}><Trash2 /></button>
      </div>)}
    </div>
    {documentToDelete && <div className="modal-backdrop" role="presentation" onMouseDown={() => !deleteState.loading && setDocumentToDelete(null)}>
      <section className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="delete-modal-icon"><Trash2 /></div>
        <div>
          <h2 id="delete-dialog-title">Delete document?</h2>
          <p><strong>{documentToDelete.title || "Untitled document"}</strong> will be permanently removed. This action cannot be undone.</p>
          {deleteState.error && <p className="delete-error">{deleteState.error}</p>}
        </div>
        <div className="delete-modal-actions">
          <button className="cancel-delete" disabled={deleteState.loading} onClick={() => setDocumentToDelete(null)}>Cancel</button>
          <button className="confirm-delete" disabled={deleteState.loading} onClick={removeDocument}>{deleteState.loading ? "Deleting..." : "Delete document"}</button>
        </div>
      </section>
    </div>}
  </aside>;
}
