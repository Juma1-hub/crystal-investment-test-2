"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
export default function AdminSupportInbox({ isSupaAdmin = false }: { isSupaAdmin?: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [viewCleared, setViewCleared] = useState(false);
  async function load() {
    const db = getSupabaseBrowserClient(); if (!db) return;
    const { data, error } = await db.from("crystal_support_messages").select("*").is("archived_at", null).order("created_at", { ascending: false });
    if (error) { setMessage(`Unable to load support inbox: ${error.message}`); return; }
    setRows(data || []); setViewCleared(false);
  }
  useEffect(() => { void load(); }, []);
  async function update(id: string, status: string) {
    const db = getSupabaseBrowserClient(); if (!db) return;
    const { error } = await db.rpc("admin_update_support_message", { p_message_id: id, p_status: status });
    if (error) { setMessage(error.message); return; }
    setMessage(status === "resolved" ? "Message marked resolved." : "Message reopened."); await load();
  }
  async function archive(id: string) {
    if (!window.confirm("Archive this resolved support record? It will be hidden from the active inbox but retained in the database and audit history.")) return;
    const db = getSupabaseBrowserClient(); if (!db) return;
    const { error } = await db.rpc("admin_archive_resolved_support_message", { p_message_id: id });
    if (error) { setMessage(error.message); return; }
    setMessage("Support record archived. The original record has been retained."); await load();
  }
  return <section className="admin-panel"><div className="admin-panel-head"><div><h3>Support inbox</h3><p>Review enquiries, resolve conversations and preserve completed records through archiving.</p></div><div className="admin-row-actions"><button className="admin-secondary" type="button" onClick={() => void load()}>Refresh</button>{isSupaAdmin&&<button className="admin-secondary" type="button" onClick={() => {setRows([]);setViewCleared(true);setMessage("Inbox view cleared. Original messages remain securely stored; use Refresh to display them again.");}}>Clear view</button>}</div></div>{message && <p className="admin-help" role="status">{message}</p>}{rows.length === 0 ? <div className="admin-empty">{viewCleared?"The inbox view is clear. Original messages remain securely stored.":"No active support messages."}</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Message</th><th>Category</th><th>Status</th><th>Received</th><th>Action</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td><b>{r.subject || "Investor enquiry"}</b><small>{r.sender_name} · {r.sender_email}</small><small>{r.message}</small></td><td>{r.category}</td><td>{r.status}</td><td>{new Date(r.created_at).toLocaleString()}</td><td className="admin-row-actions">{r.status === "resolved" ? <>{isSupaAdmin && <button className="admin-secondary" onClick={() => void archive(r.id)}>Archive</button>}<button className="admin-secondary" onClick={() => void update(r.id, "open")}>Reopen</button></> : <button className="admin-primary" onClick={() => void update(r.id, "resolved")}>Resolve</button>}</td></tr>)}</tbody></table></div>}</section>;
}
