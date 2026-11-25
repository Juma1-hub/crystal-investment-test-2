"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Setting = { category: string; automatic_enabled: boolean; manual_enabled: boolean; provider_ready: boolean };
const labels: Record<string, string> = {
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  allocations: "Investment allocations",
  distributions: "Investment distributions",
  referral_commissions: "Referral commissions",
  refunds: "Refunds",
  reversals: "Reversals",
};

export default function AdminProcessingControls({ isSupaAdmin }: { isSupaAdmin: boolean }) {
  const [rows, setRows] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const db = getSupabaseBrowserClient();
    if (!db) { setNotice("Processing controls are temporarily unavailable."); setLoading(false); return; }
    const { data, error } = await db.rpc("admin_get_transaction_processing_settings");
    if (error) setNotice(error.message);
    else { setRows((data || []) as Setting[]); setNotice(""); }
    setLoading(false);
  }, []);
  useEffect(() => { if (isSupaAdmin) void load(); else setLoading(false); }, [isSupaAdmin, load]);

  async function save(row: Setting, field: "automatic_enabled" | "manual_enabled", checked: boolean) {
    const next = { ...row, [field]: checked };
    if (!next.automatic_enabled && !next.manual_enabled) {
      setNotice("At least one processing method must remain enabled."); return;
    }
    const db = getSupabaseBrowserClient(); if (!db) return;
    setBusy(row.category); setNotice("");
    const { error } = await db.rpc("admin_set_transaction_processing_modes", {
      p_category: row.category,
      p_automatic_enabled: next.automatic_enabled,
      p_manual_enabled: next.manual_enabled,
    });
    setBusy(null);
    if (error) setNotice(error.message);
    else { setNotice(`${labels[row.category] || row.category} settings saved.`); await load(); }
  }

  if (!isSupaAdmin) return <section className="admin-panel"><h3>Transaction processing controls</h3><p className="admin-help">These controls are restricted to the Supa Admin.</p></section>;
  return <section className="admin-panel">
    <div className="admin-panel-head"><div><h3>Transaction processing controls</h3><p>Automatic and manual verification are controlled independently for each transaction category. Manual review is enabled by default.</p></div><button className="admin-secondary" type="button" onClick={() => void load()} disabled={loading || !!busy}>Refresh</button></div>
    {notice && <p className="admin-help" role="status">{notice}</p>}
    {loading ? <div className="admin-empty">Loading processing settings…</div> : rows.length === 0 ? <div className="admin-empty">No processing settings are available.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Transaction category</th><th>Automatic processing</th><th>Manual verification</th><th>Provider status</th></tr></thead><tbody>{rows.map(row => <tr key={row.category}><td><b>{labels[row.category] || row.category}</b></td><td><label className="processing-toggle"><input type="checkbox" checked={row.automatic_enabled} disabled={!!busy || !row.provider_ready || row.category === "allocations"} onChange={e => void save(row, "automatic_enabled", e.target.checked)}/><span>{row.category === "allocations" ? "Required" : row.automatic_enabled ? "Enabled" : "Disabled"}</span></label></td><td><label className="processing-toggle"><input type="checkbox" checked={true} disabled={true}/><span>Always enabled</span></label></td><td>{row.category === "allocations" ? "Internal workflow ready" : row.provider_ready ? "Verified provider configured" : "Not configured / not verified"}</td></tr>)}</tbody></table></div>}
    <p className="admin-help">Manual verification remains available for every category. External payment automation requires an integrated and verified provider adapter.</p>
  </section>;
}
