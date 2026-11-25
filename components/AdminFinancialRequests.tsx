"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type RequestRow = {
  id: string; investor_id: string; amount: number; currency: string; status: string;
  created_at: string; reviewed_at: string | null; reviewed_by: string | null;
  payment_method?: string | null; payment_reference?: string | null; sender_name?: string | null; provider_status?: string | null; provider_receipt?: string | null; provider_verified_at?: string | null;
  destination_details?: Record<string, unknown> | null;
  payout_provider_reference?: string | null; payout_confirmed_at?: string | null; review_note?: string | null;
};

export default function AdminFinancialRequests({ kind }: { kind: "deposit" | "withdrawal" }) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Unable to load requests."); setLoading(false); return; }
    setLoading(true);
    const table = kind === "deposit" ? "deposit_requests" : "withdrawal_requests";
    const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) setMessage(error.message);
    else { setRows((data || []) as RequestRow[]); setMessage(""); }
    setLoading(false);
  }, [kind]);
  useEffect(() => { void load(); }, [load]);

  async function review(row: RequestRow, status: "approved" | "rejected") {
    const verb = status === "approved" ? "approve" : "reject";
    const label = kind === "deposit" ? "deposit" : "withdrawal";
    const note = window.prompt(status === "approved"
      ? `Enter the manual verification/review note for this ${label} request (at least 10 characters):`
      : `Enter the reason for rejecting this ${label} request (at least 10 characters):`);
    if (!note || note.trim().length < 10) { setMessage("A review note of at least 10 characters is required."); return; }
    if (!window.confirm(`Are you sure you want to ${verb} this ${label} request for ${row.currency} ${Number(row.amount).toLocaleString()}?`)) return;
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Unable to connect to the account service."); return; }
    setBusyId(row.id); setMessage("");
    const { data: assurance, error: assuranceError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setMessage("Complete multi-factor authentication, then retry this review."); setBusyId(null); return;
    }
    const { error } = await db.rpc("admin_review_financial_request_v2", {
      p_request_type: kind, p_request_id: row.id, p_status: status, p_review_note: note.trim(),
    });
    if (error) setMessage(error.message);
    else setMessage(kind === "withdrawal" && status === "approved"
      ? "Withdrawal approved and reserved. Confirm the actual payout separately after provider verification."
      : `${label[0].toUpperCase()}${label.slice(1)} request ${status}.`);
    setBusyId(null);
    await load();
  }

  async function reconcileApprovedDeposit(row: RequestRow) {
    const note = window.prompt("Explain the evidence and reason for reconciling this previously approved deposit (at least 20 characters):");
    if (!note || note.trim().length < 20) { setMessage("A detailed reconciliation note is required."); return; }
    if (!window.confirm(`Verify and complete the ledger posting and eight-division allocations for the previously approved KES ${Number(row.amount).toLocaleString()} deposit? This will not create a duplicate credit.`)) return;
    const db = getSupabaseBrowserClient(); if (!db) { setMessage("Unable to connect to the account service."); return; }
    setBusyId(row.id); setMessage("");
    const { data: assurance, error: assuranceError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setMessage("Complete multi-factor authentication, then retry this reconciliation."); setBusyId(null); return;
    }
    const { data, error } = await db.rpc("admin_reconcile_approved_deposit_v2", {
      p_request_id: row.id, p_reconciliation_note: note.trim(),
    });
    if (error) setMessage(error.message);
    else setMessage(`Approved deposit verified. ${Number((data as {new_allocations_created?:number})?.new_allocations_created || 0)} new division allocations created; no duplicate ledger credit was made.`);
    setBusyId(null); await load();
  }

  async function confirmPayout(row: RequestRow) {
    const reference = window.prompt("Enter the M-Pesa/bank transaction reference after independently confirming successful payment:");
    if (!reference || reference.trim().length < 6) { setMessage("A valid provider transaction reference is required."); return; }
    const note = window.prompt("Describe how you verified the successful payout in the provider portal or bank statement (at least 20 characters):");
    if (!note || note.trim().length < 20) { setMessage("A detailed payout verification note is required. A screenshot alone is not proof of payment."); return; }
    if (!window.confirm(`Confirm that KES ${Number(row.amount).toLocaleString()} was successfully paid to the investor?`)) return;
    const db = getSupabaseBrowserClient(); if (!db) { setMessage("Unable to connect to the account service."); return; }
    setBusyId(row.id); setMessage("");
    const { data: assurance, error: assuranceError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setMessage("Complete multi-factor authentication, then retry this payout confirmation."); setBusyId(null); return;
    }
    const { error } = await db.rpc("admin_confirm_withdrawal_payout_manual", {
      p_withdrawal_id: row.id, p_provider_reference: reference.trim(), p_confirmation_note: note.trim(),
    });
    if (error) setMessage(error.message);
    else setMessage("Payout confirmed. The ledger debit and principal/earnings adjustments were recorded.");
    setBusyId(null); await load();
  }

  async function cancelApprovedWithdrawal(row: RequestRow) {
    const reason = window.prompt("Why is this approved payout being cancelled? (at least 10 characters):");
    if (!reason || reason.trim().length < 10) { setMessage("A cancellation reason is required."); return; }
    const db = getSupabaseBrowserClient(); if (!db) return;
    setBusyId(row.id); setMessage("");
    const { data: assurance, error: assuranceError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setMessage("Complete multi-factor authentication, then retry."); setBusyId(null); return;
    }
    const { error } = await db.rpc("admin_cancel_approved_withdrawal", { p_withdrawal_id: row.id, p_reason: reason.trim() });
    if (error) setMessage(error.message); else setMessage("Approved unpaid withdrawal cancelled; its reservation has been released.");
    setBusyId(null); await load();
  }

  const pending = rows.filter(r => ["pending", "submitted", "under review", "under_review", "processing"].includes(String(r.status).toLowerCase()));
  const approved = rows.filter(r => String(r.status).toLowerCase() === "approved");
  const rejected = rows.filter(r => ["rejected", "declined", "void"].includes(String(r.status).toLowerCase()));
  const destination = (r: RequestRow) => {
    const d = r.destination_details || {};
    return [d.method, d.bank_name, d.account_holder, d.account_number, d.phone].filter(Boolean).join(" · ") || "—";
  };
  return <section className="admin-panel">
    <div className="admin-panel-head"><div><h3>{kind === "deposit" ? "Deposit approvals" : "Withdrawal approvals"}</h3><p>Review the request details and record an authorised decision.</p></div><button className="admin-secondary" type="button" onClick={() => void load()} disabled={loading || !!busyId}><RefreshCw size={15}/> Refresh</button></div>
    {message && <p className="admin-help" role="status">{message}</p>}
    <div className="admin-stat-grid"><article className="admin-stat"><span>Total requests</span><strong>{rows.length}</strong></article><article className="admin-stat"><span>Awaiting review</span><strong>{pending.length}</strong></article><article className="admin-stat"><span>Approved</span><strong>{approved.length}</strong></article><article className="admin-stat"><span>Rejected / void</span><strong>{rejected.length}</strong></article></div>
    {loading ? <div className="admin-empty">Loading requests…</div> : rows.length === 0 ? <div className="admin-empty">No requests to display.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Request</th><th>Investor</th><th>Amount</th><th>{kind === "deposit" ? "Payment details" : "Withdrawal destination"}</th><th>Status</th><th>Submitted</th><th>Reviewed</th><th>Decision</th></tr></thead><tbody>{rows.map(row => {
      const isPending = ["pending", "submitted", "under review", "under_review", "processing"].includes(String(row.status).toLowerCase());
      const isApproved = String(row.status).toLowerCase() === "approved";
      return <tr key={row.id}><td><small>{row.id}</small></td><td><small>{row.investor_id}</small></td><td><b>{row.currency} {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td><td>{kind === "deposit" ? <>{row.payment_method || "—"}<small>{row.payment_reference || "No reference"}{row.sender_name ? ` · ${row.sender_name}` : ""}{row.provider_status ? ` · Provider: ${row.provider_status}` : ""}{row.provider_receipt ? ` · Receipt: ${row.provider_receipt}` : ""}</small></> : <>{destination(row)}{row.payout_provider_reference && <small>Paid reference: {row.payout_provider_reference}</small>}</>}</td><td><span className={`admin-pill ${String(row.status || "").toLowerCase().replaceAll(" ", "-")}`}>{row.status}</span></td><td>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td><td>{row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : "—"}</td><td>{isPending ? <div className="admin-row-actions"><button className="admin-primary" type="button" disabled={!!busyId} onClick={() => void review(row, "approved")}>{busyId === row.id ? "Saving…" : <><CheckCircle2 size={14}/> Approve</>}</button><button className="admin-secondary" type="button" disabled={!!busyId} onClick={() => void review(row, "rejected")}><XCircle size={14}/> Reject</button></div> : kind === "deposit" && isApproved ? <div className="admin-row-actions"><button className="admin-primary" type="button" disabled={!!busyId} onClick={() => void reconcileApprovedDeposit(row)}>Verify / complete posting</button></div> : kind === "withdrawal" && isApproved ? <div className="admin-row-actions"><button className="admin-primary" type="button" disabled={!!busyId} onClick={() => void confirmPayout(row)}>Confirm payout</button><button className="admin-secondary" type="button" disabled={!!busyId} onClick={() => void cancelApprovedWithdrawal(row)}>Cancel</button></div> : "—"}</td></tr>;
    })}</tbody></table></div>}
  </section>;
}
