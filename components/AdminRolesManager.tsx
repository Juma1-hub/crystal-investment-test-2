"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Save, ShieldCheck, UserPlus, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AdminRow = { user_id: string; email: string; role: "Supa Admin" | "Junior Admin"; permissions: Record<string, boolean> | null; is_active: boolean };
type Permission = { key: string; label: string; description: string; group: string };
const permissions: Permission[] = [
  { key: "overview", label: "Overview", description: "View the limited administrator landing page.", group: "Workspace" },
  { key: "system_health", label: "System health", description: "View non-secret operational status and security controls.", group: "Workspace" },
  { key: "analytics", label: "Analytics", description: "View approved financial activity summaries.", group: "Workspace" },
  { key: "investors", label: "Investor management", description: "View and edit investor profile information.", group: "Investor services" },
  { key: "kyc", label: "KYC & compliance", description: "Review submitted identity and compliance records.", group: "Investor services" },
  { key: "deposit_approvals", label: "Deposit review", description: "Review deposit requests through the protected review workflow.", group: "Financial operations" },
  { key: "withdrawal_approvals", label: "Withdrawal review", description: "Review withdrawal requests through the protected review workflow.", group: "Financial operations" },
  { key: "portfolio", label: "Investment portfolio", description: "View investment allocation records and permitted portfolio actions.", group: "Financial operations" },
  { key: "opportunities", label: "Investment opportunities", description: "Manage published opportunity information.", group: "Financial operations" },
  { key: "distributions", label: "Distributions", description: "Review distribution records and workflows.", group: "Financial operations" },
  { key: "referrals", label: "Referral programme", description: "Review eligible referral commissions and statuses.", group: "Financial operations" },
  { key: "team", label: "Team & branches", description: "Manage permitted team and branch information.", group: "Company operations" },
  { key: "website_content", label: "Website content", description: "Edit approved public website content.", group: "Company operations" },
  { key: "platform_settings", label: "Platform settings", description: "Edit permitted non-financial platform settings.", group: "Company operations" },
  { key: "market_conditions", label: "Market conditions", description: "Publish sourced market observations.", group: "Company operations" },
  { key: "support", label: "Support inbox", description: "Respond to and manage investor support enquiries.", group: "Company operations" },
  { key: "admin_conversations", label: "Admin conversations", description: "Read and send private administrator messages.", group: "Company operations" },
  { key: "reports", label: "Reports & audit", description: "View permitted reports and audit records.", group: "Governance" },
  { key: "admin_conversations", label: "Admin conversations", description: "Access private administrator conversations.", group: "Governance" },
  { key: "system_health", label: "Platform health", description: "View system diagnostics and operational health.", group: "Governance" },
];
const groups = [...new Set(permissions.map(p => p.group))];
export default function AdminRolesManager() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => rows.find(r => r.user_id === selectedId && r.role === "Junior Admin"), [rows, selectedId]);
  async function load(keepSelection = true) {
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Administrator permissions are temporarily unavailable."); return; }
    setBusy(true);
    const { data, error } = await db.rpc("admin_list_memberships");
    setBusy(false);
    if (error) { setMessage(`Could not load administrator memberships: ${error.message}`); return; }
    const next = (data || []) as AdminRow[];
    setRows(next);
    const current = keepSelection ? next.find(r => r.user_id === selectedId && r.role === "Junior Admin") : undefined;
    const junior = current || next.find(r => r.role === "Junior Admin" && r.is_active);
    setSelectedId(junior?.user_id || "");
    setDraft(junior ? { ...(junior.permissions || {}) } : {});
    setMessage("");
  }
  useEffect(() => { void load(false); }, []);
  function toggle(key: string, value: boolean) { setDraft(prev => ({ ...prev, [key]: value })); }
  async function appoint() {
    const email = window.prompt("Enter the email address of an existing registered account to appoint as Junior Admin:");
    if (!email?.trim()) return;
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Administrator services are temporarily unavailable."); return; }
    setBusy(true);
    const { error } = await db.rpc("admin_set_membership", { p_email: email.trim().toLowerCase(), p_role: "Junior Admin", p_permissions: {} });
    setBusy(false);
    if (error) { setMessage(`Appointment failed: ${error.message}`); return; }
    setMessage("Junior Admin appointed with no module permissions. Select the account below to grant only the access required.");
    await load(false);
  }
  async function requireAal2(db: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>) {
    const { data: assurance, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || assurance?.currentLevel !== "aal2") { setMessage("Complete multi-factor authentication before changing administrator access."); return false; }
    return true;
  }
  async function changeRole(row: AdminRow) {
    const db = getSupabaseBrowserClient(); if (!db) return;
    const nextRole = row.role === "Supa Admin" ? "Junior Admin" : "Supa Admin";
    if (!window.confirm(`${nextRole === "Supa Admin" ? "Promote" : "Demote"} ${row.email} to ${nextRole}?`)) return;
    if (!(await requireAal2(db))) return;
    setBusy(true);
    const { error } = await db.rpc("admin_set_membership", { p_email: row.email, p_role: nextRole, p_permissions: row.permissions || {} });
    setBusy(false);
    if (error) { setMessage(`Role change failed: ${error.message}`); return; }
    setMessage(`${row.email} is now ${nextRole}.`); await load(false);
  }
  async function removeAccess(row: AdminRow) {
    if (!window.confirm(`Remove administrator access for ${row.email}?`)) return;
    const db = getSupabaseBrowserClient(); if (!db) return;
    if (!(await requireAal2(db))) return;
    setBusy(true);
    const { error } = await db.rpc("admin_remove_membership", { p_user_id: row.user_id });
    setBusy(false);
    if (error) { setMessage(`Administrator access was not removed: ${error.message}`); return; }
    if (selectedId === row.user_id) { setSelectedId(""); setDraft({}); }
    setMessage(`Administrator access removed for ${row.email}.`); await load(false);
  }
  async function save() {
    if (!selected) return;
    const db = getSupabaseBrowserClient();
    if (!db) { setMessage("Administrator services are temporarily unavailable."); return; }
    const { data: assurance, error: assuranceError } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") { setMessage("For security, complete multi-factor authentication before changing administrator permissions."); return; }
    const payload = Object.fromEntries(permissions.map(p => [p.key, draft[p.key] === true]));
    setBusy(true);
    const { error } = await db.rpc("admin_update_junior_permissions", { p_user_id: selected.user_id, p_permissions: payload });
    setBusy(false);
    if (error) { setMessage(`Permissions were not changed: ${error.message}. Please refresh and try again.`); return; }
    setMessage(`Permissions saved for ${selected.email}. Revoked permissions are no longer available to that administrator.`);
    await load(false);
    setSelectedId("");
    setDraft({});
  }
  const activeAdmins = rows.filter(r => r.is_active);
  return <section className="admin-panel admin-permissions-manager">
    <div className="admin-panel-head"><div><h3>Administrator access & permissions</h3><p>Choose a Junior Admin, then tick only the modules and actions they need. Changes are securely saved and enforced by administrator permissions.</p></div><div className="admin-permission-toolbar"><button className="admin-secondary" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={15}/> Refresh</button><button className="admin-primary" type="button" onClick={appoint} disabled={busy}><UserPlus size={15}/> Appoint Junior Admin</button></div></div>
    {message && <p className="admin-help" role="status">{message}</p>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Administrator account</th><th>Role</th><th>Status</th><th>Permissions</th><th>Role actions</th></tr></thead><tbody>{activeAdmins.map(row => <tr key={row.user_id} className={row.user_id === selectedId ? "permission-selected-row" : ""}><td><b>{row.email}</b></td><td>{row.role}</td><td>{row.is_active ? "Active" : "Inactive"}</td><td>{row.role === "Supa Admin" ? <span className="admin-pill">Full control</span> : <button type="button" className="admin-secondary" onClick={() => { setSelectedId(row.user_id); setDraft({ ...(row.permissions || {}) }); }}>Manage permissions</button>}</td><td className="admin-row-actions"><button type="button" className="admin-secondary" disabled={busy} onClick={() => void changeRole(row)}>{row.role === "Supa Admin" ? "Demote" : "Promote"}</button><button type="button" className="admin-secondary" disabled={busy} onClick={() => void removeAccess(row)}>Remove access</button></td></tr>)}</tbody></table></div>
    {selected ? <div className="permission-editor"><div className="permission-editor-heading"><div><span className="eyebrow">JUNIOR ADMIN PERMISSIONS</span><h4>{selected.email}</h4><p>Untick any permission to revoke it. Supa Admin-only controls, including role management and global interest-rate changes, cannot be delegated here.</p></div><button type="button" className="admin-primary" onClick={save} disabled={busy}><Save size={16}/>{busy ? "Saving…" : "Save permissions"}</button></div>
      <div className="admin-table-wrap permission-matrix-wrap"><table className="admin-table permission-matrix"><thead><tr><th>Category</th><th>Permission</th><th>Description</th><th>Granted</th></tr></thead><tbody>{permissions.map(permission=><tr key={permission.key}><td>{permission.group}</td><td><b>{permission.label}</b></td><td>{permission.description}</td><td><label className="permission-table-toggle"><input aria-label={`Grant ${permission.label}`} type="checkbox" checked={draft[permission.key]===true} onChange={e=>toggle(permission.key,e.target.checked)}/><span>{draft[permission.key]===true?"Allowed":"Not allowed"}</span></label></td></tr>)}</tbody></table></div>
      <div className="permission-footer"><ShieldCheck size={16}/><span>Permission changes require Supa Admin MFA (AAL2), are recorded in the administrator audit log, and are rechecked by protected database functions.</span></div>
    </div> : <div className="admin-empty">No active Junior Admin selected. Appoint a Junior Admin or select an existing one to configure permissions.</div>}
  </section>;
}
