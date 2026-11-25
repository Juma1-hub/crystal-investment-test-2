"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
export default function AdminFinancialSummary() {
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { let live = true; (async () => { const db = getSupabaseBrowserClient(); if (!db) { if (live) { setMessage("Financial summaries are temporarily unavailable."); setLoading(false); } return; } const { data, error } = await db.rpc("admin_get_analytics_summary"); if (!live) return; if (error) setMessage(error.message); else setRows(data || []); setLoading(false); })(); return () => { live = false; }; }, []);
  return <section className="admin-panel" style={{ marginBottom: 16 }}><div className="admin-panel-head"><div><h3>Recorded financial summary</h3><p>Deposit and withdrawal totals are calculated from ledger-posted credits and debits. Pending requests are shown separately; historical currency records remain unchanged.</p></div></div>{message && <p className="admin-help" role="status">{message}</p>}{loading ? <p className="admin-help">Loading financial summary…</p> : rows.length === 0 ? <div className="admin-empty">No financial summary rows are available.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Recorded currency</th><th>Ledger-posted deposits</th><th>Ledger-posted withdrawals</th><th>Pending deposits</th><th>Pending withdrawals</th></tr></thead><tbody>{rows.map(row => <tr key={row.currency}><td><b>{row.currency}</b></td><td>{Number(row.approved_deposits || 0).toLocaleString()}</td><td>{Number(row.approved_withdrawals || 0).toLocaleString()}</td><td>{Number(row.pending_deposits || 0)}</td><td>{Number(row.pending_withdrawals || 0)}</td></tr>)}</tbody></table></div>}</section>;
}
