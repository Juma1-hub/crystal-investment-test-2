"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Health = { database_time?: string; last_kes_accrual_date?: string | null; pending_deposit_requests?: number; pending_withdrawal_requests?: number; approved_unposted_deposit_count?: number; approved_unposted_withdrawal_count?: number; active_divisions?: number; active_admin_count?: number; legacy_admin_membership_count?: number; kyc_bucket_private?: boolean; deposit_approval_paused?: boolean; withdrawal_payout_paused?: boolean; allocation_mutations_paused?: boolean; mpesa_provider_ready?: boolean; distribution_provider_ready?: boolean; automatic_categories_enabled?: string[] };
export default function AdminSystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("System health service is unavailable."); setLoading(false); return; }
    const { data, error } = await db.rpc("admin_get_system_health");
    if (error) setMessage(error.message); else setHealth(data as Health);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <section className="admin-panel"><p>Checking system health…</p></section>;
  if (!health) return <section className="admin-panel"><p className="admin-help">{message || "System health information is unavailable."}</p><button className="admin-secondary" onClick={() => { setLoading(true); void load(); }}>Retry</button></section>;
  const checks = [
    ["KYC storage bucket private", health.kyc_bucket_private],
    ["Legacy admin table has no active memberships", Number(health.legacy_admin_membership_count || 0) === 0],
    ["Deposit approval workflow available", !health.deposit_approval_paused],
    ["Withdrawal payout confirmation available", !health.withdrawal_payout_paused],
    ["Eight-division allocation workflow available", !health.allocation_mutations_paused],
    ["M-Pesa provider configured and verified", health.mpesa_provider_ready],
    ["Distribution payout provider configured and verified", health.distribution_provider_ready],
  ] as const;
  return <div className="admin-panels"><section className="admin-panel"><div className="admin-panel-head"><div><h3>System health</h3><p>Operational checks only. No passwords, API keys or provider secrets are displayed.</p></div><button className="admin-secondary" onClick={() => { setLoading(true); void load(); }}>Refresh</button></div><div className="admin-stats-grid">{[["Active administrators",health.active_admin_count],["Active investment divisions",health.active_divisions],["Pending deposit requests",health.pending_deposit_requests],["Pending withdrawal requests",health.pending_withdrawal_requests],["Approved deposits without ledger credit",health.approved_unposted_deposit_count],["Approved withdrawals without ledger debit",health.approved_unposted_withdrawal_count],["Latest KES accrual date",health.last_kes_accrual_date || "Not yet recorded"],["Automatic processing categories",(health.automatic_categories_enabled || []).length]].map(([label,value])=><div className="admin-stat" key={String(label)}><span>{label}</span><strong>{String(value ?? 0)}</strong></div>)}</div></section><section className="admin-panel"><div className="admin-panel-head"><div><h3>Security and processing checks</h3><p>Sensitive financial actions require administrator permissions and MFA. Automatic payment processing remains gated by provider verification.</p></div></div><div className="record-list">{checks.map(([label,ok])=><div className="record-row" key={label}><span>{label}</span><em style={{ color: ok ? "#26734d" : "#a36a24" }}>{ok ? "Confirmed" : "Not confirmed / restricted"}</em></div>)}</div><small>System time: {health.database_time ? new Date(health.database_time).toLocaleString() : "Unavailable"}</small></section>{message&&<p className="admin-help" role="status">{message}</p>}</div>;
}
