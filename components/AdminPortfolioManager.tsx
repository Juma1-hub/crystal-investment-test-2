"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
type Investment = { id: string; investor_id: string; investor_email: string; project_name: string; amount: number; currency: string; annual_rate: number; day_count_basis: number; terms_reference: string; status: string; activated_at: string | null; created_at: string };
const divisions = ["Energy & Petroleum", "Agriculture & Agribusiness", "Real Estate & Infrastructure", "Mining & Minerals", "Shipping & Logistics", "Technology & Innovation", "Global Markets & Securities", "General Investments & Acquisitions"];
export default function AdminPortfolioManager() {
  const [rows, setRows] = useState<Investment[]>([]);
  const [message, setMessage] = useState("");
  async function load() {
    const db = getSupabaseBrowserClient(); if (!db) { setMessage("Investment records are temporarily unavailable."); return; }
    const { data, error } = await db.rpc("admin_list_investment_allocations");
    if (error) { setMessage(`Investment records could not be loaded: ${error.message}`); return; }
    setRows((data || []) as Investment[]);
  }
  useEffect(() => { void load(); }, []);
  return <div className="admin-portfolio-manager">
    <section className="admin-panel"><div className="admin-panel-head"><div><h3>Investment allocation management</h3><p>The allocation pool is fixed to the eight official divisions below. Approved deposits are allocated automatically and equally across the eight active divisions. Principal changes are recorded through the withdrawal workflow.</p></div><button className="admin-secondary" onClick={() => void load()}>Refresh</button></div>
      <div className="admin-example-grid">{divisions.map((name, index) => <article key={name}><span>DIVISION {String(index + 1).padStart(2, "0")}</span><h4>{name}</h4><b>12.5% allocation share</b></article>)}</div>
      <p className="admin-help">An approved deposit must be distributed equally across all eight divisions, with rounding adjusted so the allocation total equals the deposit exactly. New approved deposits create eight auditable KES allocation records. Historical allocations remain unchanged.</p>
    </section>
    <section className="admin-panel" style={{ marginTop: 16 }}><div className="admin-panel-head"><h3>Recorded investor allocations</h3></div>{message && <p className="admin-help" role="status">{message}</p>}{rows.length === 0 ? <div className="admin-empty">No investor allocations are available.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Division / project</th><th>Investor</th><th>Principal</th><th>Rate</th><th>Status</th><th>Created</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><b>{row.project_name}</b><small>{row.terms_reference}</small></td><td>{row.investor_email}</td><td>{row.currency} {Number(row.amount).toLocaleString()}</td><td>{Number(row.annual_rate).toFixed(2)}% p.a.</td><td>{row.status}</td><td>{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
