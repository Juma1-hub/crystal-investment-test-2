"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DocumentRow = { id: string; document_type: string; status: string; created_at: string };
const accepted = ["application/pdf", "image/jpeg", "image/png"];
export default function InvestorKycUpload() {
  const [documentType, setDocumentType] = useState("National ID");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const db = getSupabaseBrowserClient();
  async function load() {
    if (!db) return;
    const { data, error } = await db.from("investor_documents").select("id,document_type,status,created_at").order("created_at", { ascending: false });
    if (error) setMessage("Your document history could not be loaded.");
    else setRows((data || []) as DocumentRow[]);
  }
  useEffect(() => { void load(); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !file) { setMessage("Choose a document before submitting."); return; }
    if (!accepted.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setMessage("Upload a PDF, JPG or PNG file up to 10 MB."); return;
    }
    setBusy(true); setMessage("");
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData.user) { setBusy(false); setMessage("Sign in again before uploading a document."); return; }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const storagePath = `${authData.user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await db.storage.from("investor-documents").upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) { setBusy(false); setMessage(`Document upload failed: ${uploadError.message}`); return; }
    const { error: insertError } = await db.from("investor_documents").insert({
      investor_id: authData.user.id, document_type: documentType, storage_path: storagePath, status: "Submitted",
    });
    if (insertError) {
      await db.storage.from("investor-documents").remove([storagePath]);
      setBusy(false); setMessage(`The document record could not be submitted: ${insertError.message}`); return;
    }
    setFile(null); setBusy(false); setMessage("Document submitted securely for KYC review.");
    await load();
  }
  return <section className="portal-card" style={{ marginBottom: 18 }}>
    <div className="card-heading"><div><h3>Identity verification</h3><p>Upload a clear PDF, JPG or PNG. Files are private and visible only to you and authorised compliance reviewers.</p></div></div>
    <form className="portal-form" onSubmit={submit}>
      <label>Document type<select value={documentType} onChange={e => setDocumentType(e.target.value)}><option>National ID</option><option>Passport</option><option>Proof of Address</option><option>Other</option></select></label>
      <label>Document file<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] || null)} required /></label>
      <button className="button button-gold" type="submit" disabled={busy || !file}>{busy ? "Uploading securely…" : "Submit for verification"}</button>
    </form>
    {message && <p className="portal-note" role="status">{message}</p>}
    <div className="record-list"><h3>Submitted documents</h3>{rows.length === 0 ? <p className="portal-empty">No identity documents have been submitted.</p> : rows.map(row => <div className="record-row" key={row.id}><div><b>{row.document_type}</b><small>{new Date(row.created_at).toLocaleDateString()}</small></div><em>{row.status}</em></div>)}</div>
  </section>;
}
