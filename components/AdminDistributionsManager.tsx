"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Distribution = { id: string; investor_name: string; investor_email: string; project_name: string; amount: number; currency: string; distribution_date: string; status: string; description?: string | null };
export default function AdminDistributionsManager() {
  const [rows, setRows] = useState<Distribution[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Distribution records are temporarily unavailable."); setLoading(false); return; }
    const { data, error } = await db.rpc("admin_list_investment_distributions");
    if (error) setMessage(`Unable to load distribution records: ${error.message}`);
    else { setRows((data || []) as Distribution[]); setMessage(""); }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function changeStatus(row: Distribution, status: "Approved" | "Cancelled") {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this ${row.currency} ${Number(row.amount).toLocaleString()} distribution?`)) return;
    const db = getSupabaseBrowserClient(); if (!db) return;
    setBusyId(row.id); setMessage("");
    const { error } = await db.rpc("admin_update_distribution_status", { p_distribution_id: row.id, p_status: status });
    setBusyId(null);
    if (error) setMessage(error.message);
    else setMessage(`Distribution ${status.toLowerCase()}.`);
    await load();
  }

  async function confirmManualPayment(row: Distribution) {
    const reference = window.prompt("Enter the M-Pesa/bank provider transaction reference after independently confirming successful payment:");
    if (!reference || reference.trim().length < 4) return;
    const note = window.prompt("Describe how you independently verified the payment in the provider statement/portal (minimum 20 characters):");
    if (!note || note.trim().length < 20) { setMessage("A meaningful verification note is required. A screenshot alone is not proof of payment."); return; }
    if (!window.confirm("Confirm that the provider shows this payout as successful and the amount matches exactly?")) return;
    const db = getSupabaseBrowserClient(); if (!db) return;
    setBusyId(row.id); setMessage("");
    const { error } = await db.rpc("admin_confirm_distribution_payout_manual", {
      p_distribution_id: row.id, p_provider_reference: reference.trim(), p_confirmation_note: note.trim(),
    });
    setBusyId(null);
    if (error) setMessage(error.message);
    else setMessage("Payout manually verified and recorded. The ledger and audit entry were posted by the database function.");
    await load();
  }

  return <section className="admin-panel">
    <div className="admin-panel-head"><div><h3>Investment distributions</h3><p>Approve distributions here. A distribution is not marked Paid until provider confirmation or an independently verified manual confirmation is recorded.</p></div><button className="admin-secondary" type="button" onClick={() => void load()} disabled={loading || !!busyId}>Refresh</button></div>
    {message && <p className="admin-help" role="status">{message}</p>}
    {loading ? <div className="admin-empty">Loading distribution records…</div> : rows.length === 0 ? <div className="admin-empty">No distribution records are available.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Investor</th><th>Investment</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.investor_name}</b><small>{row.investor_email}</small></td><td>{row.project_name}</td><td>{row.currency} {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>{new Date(row.distribution_date).toLocaleDateString()}</td><td>{row.status}</td><td className="admin-row-actions">{row.status === "Draft" && <button type="button" disabled={!!busyId} onClick={() => void changeStatus(row, "Approved")}>Approve</button>}{row.status === "Approved" && <><button type="button" disabled={!!busyId} onClick={() => void confirmManualPayment(row)}>Confirm verified payout</button><button type="button" disabled={!!busyId} onClick={() => void changeStatus(row, "Cancelled")}>Cancel</button></>}</td></tr>)}</tbody></table></div>}
    <p className="admin-help">Automatic payout confirmation is reserved for a deployed, verified provider callback. Manual confirmation requires an independently checked provider record; uploaded screenshots alone do not establish payment.</p>
  </section>;
}
