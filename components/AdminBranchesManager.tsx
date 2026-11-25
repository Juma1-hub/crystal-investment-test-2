"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const blankBranch = { id: "", name: "", location: "", country: "Kenya", contact_email: "", contact_phone: "", status: "Active" };
const blankMember = { id: "", full_name: "", role_title: "", email: "", phone: "", branch_id: "", status: "Active" };
export default function AdminBranchesManager() {
  const [branches, setBranches] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [branchForm, setBranchForm] = useState<any>(blankBranch);
  const [memberForm, setMemberForm] = useState<any>(blankMember);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const db = getSupabaseBrowserClient();
  async function load() {
    if (!db) return;
    const [branchResult, memberResult] = await Promise.all([
      db.from("crystal_branches").select("*").order("name"),
      db.from("crystal_team_members").select("*").order("full_name"),
    ]);
    if (branchResult.error || memberResult.error) { setMessage("Unable to load team and branch records. Check your access and try again."); return; }
    setBranches(branchResult.data || []); setMembers(memberResult.data || []);
  }
  useEffect(() => { void load(); }, []);
  async function saveBranch(e: React.FormEvent) {
    e.preventDefault(); if (!db) return; setBusy(true);
    const { error } = await db.rpc("admin_save_branch", { p_id: branchForm.id || null, p_name: branchForm.name, p_location: branchForm.location, p_country: branchForm.country, p_email: branchForm.contact_email, p_phone: branchForm.contact_phone, p_status: branchForm.status });
    setBusy(false); if (error) { setMessage(error.message); return; }
    setMessage("Branch record saved."); setBranchForm(blankBranch); await load();
  }
  async function saveMember(e: React.FormEvent) {
    e.preventDefault(); if (!db) return; setBusy(true);
    const { error } = await db.rpc("admin_save_team_member", { p_id: memberForm.id || null, p_full_name: memberForm.full_name, p_role_title: memberForm.role_title, p_email: memberForm.email, p_phone: memberForm.phone, p_branch_id: memberForm.branch_id || null, p_status: memberForm.status });
    setBusy(false); if (error) { setMessage(error.message); return; }
    setMessage("Team member record saved."); setMemberForm(blankMember); await load();
  }
  async function deactivate(kind: "branch" | "member", id: string) {
    if (!window.confirm(`Mark this ${kind} inactive? Its record will be retained.`)) return;
    if (!db) return;
    const { error } = await db.rpc(kind === "branch" ? "admin_deactivate_branch" : "admin_deactivate_team_member", { p_id: id });
    if (error) { setMessage(error.message); return; }
    setMessage(`${kind === "branch" ? "Branch" : "Team member"} marked inactive. The record was retained.`); await load();
  }
  return <div className="admin-panels">
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h3>Branches & locations</h3><p>Maintain confirmed company branch records. Deactivation retains the record.</p></div></div>
      <form className="admin-investment-form" onSubmit={saveBranch}>
        <label>Branch name<input value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required /></label>
        <label>Location<input value={branchForm.location} onChange={e => setBranchForm({ ...branchForm, location: e.target.value })} required /></label>
        <label>Country<input value={branchForm.country} onChange={e => setBranchForm({ ...branchForm, country: e.target.value })} required /></label>
        <label>Contact email<input type="email" value={branchForm.contact_email} onChange={e => setBranchForm({ ...branchForm, contact_email: e.target.value })} /></label>
        <label>Contact phone<input value={branchForm.contact_phone} onChange={e => setBranchForm({ ...branchForm, contact_phone: e.target.value })} /></label>
        <label>Status<select value={branchForm.status} onChange={e => setBranchForm({ ...branchForm, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label>
        <button className="admin-primary" disabled={busy}>{branchForm.id ? "Update branch" : "Add branch"}</button>
        {branchForm.id && <button type="button" className="admin-secondary" onClick={() => setBranchForm(blankBranch)}>Cancel edit</button>}
      </form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Branch</th><th>Location</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead><tbody>{branches.length === 0 ? <tr><td colSpan={5}>No branch records have been added.</td></tr> : branches.map(row => <tr key={row.id}><td>{row.name}</td><td>{row.location}, {row.country}</td><td>{row.contact_email}<small>{row.contact_phone}</small></td><td>{row.status}</td><td className="admin-row-actions"><button className="admin-secondary" onClick={() => setBranchForm(row)}>Edit</button><button className="admin-secondary" onClick={() => void deactivate("branch", row.id)} disabled={row.status === "Inactive"}>Deactivate</button></td></tr>)}</tbody></table></div>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h3>Team directory</h3><p>Maintain confirmed staff records. No staff members are pre-filled or invented.</p></div></div>
      <form className="admin-investment-form" onSubmit={saveMember}>
        <label>Full name<input value={memberForm.full_name} onChange={e => setMemberForm({ ...memberForm, full_name: e.target.value })} required /></label>
        <label>Role / position<input value={memberForm.role_title} onChange={e => setMemberForm({ ...memberForm, role_title: e.target.value })} required /></label>
        <label>Email<input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} /></label>
        <label>Phone<input value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} /></label>
        <label>Branch<select value={memberForm.branch_id} onChange={e => setMemberForm({ ...memberForm, branch_id: e.target.value })}><option value="">Not assigned</option>{branches.map(branch => <option value={branch.id} key={branch.id}>{branch.name}</option>)}</select></label>
        <label>Status<select value={memberForm.status} onChange={e => setMemberForm({ ...memberForm, status: e.target.value })}><option>Active</option><option>Inactive</option></select></label>
        <button className="admin-primary" disabled={busy}>{memberForm.id ? "Update team member" : "Add team member"}</button>
        {memberForm.id && <button type="button" className="admin-secondary" onClick={() => setMemberForm(blankMember)}>Cancel edit</button>}
      </form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Team member</th><th>Contact</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead><tbody>{members.length === 0 ? <tr><td colSpan={5}>No team members have been added.</td></tr> : members.map(row => <tr key={row.id}><td><b>{row.full_name}</b><small>{row.role_title}</small></td><td>{row.email}<small>{row.phone}</small></td><td>{branches.find(branch => branch.id === row.branch_id)?.name || "Not assigned"}</td><td>{row.status}</td><td className="admin-row-actions"><button className="admin-secondary" onClick={() => setMemberForm({ ...row, branch_id: row.branch_id || "" })}>Edit</button><button className="admin-secondary" onClick={() => void deactivate("member", row.id)} disabled={row.status === "Inactive"}>Deactivate</button></td></tr>)}</tbody></table></div>
    </section>
    {message && <p className="admin-help" role="status">{message}</p>}
  </div>;
}
