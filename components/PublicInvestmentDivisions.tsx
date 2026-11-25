"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Division = { id: string; title: string; division: string; summary: string };
export default function PublicInvestmentDivisions() {
  const [rows, setRows] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const db = getSupabaseBrowserClient();
    if (!db) { setError("Division information is temporarily unavailable."); setLoading(false); return; }
    void db.rpc("crystal_get_public_investment_divisions").then(({ data, error: rpcError }) => {
      if (!live) return;
      if (rpcError) setError("Division information is temporarily unavailable.");
      else setRows(Array.isArray(data) ? data as Division[] : []);
      setLoading(false);
    });
    return () => { live = false; };
  }, []);
  if (loading) return <div className="opportunity-grid" aria-live="polite"><article className="op-card"><div className="op-content"><p>Loading investment divisions…</p></div></article></div>;
  if (error) return <div className="admin-empty" role="status">{error}</div>;
  if (!rows.length) return <div className="admin-empty">Investment division information is currently unavailable.</div>;
  return <div className="opportunity-grid">{rows.map((row,index)=><article className={`op-card op-card-${index+1}`} key={row.id}><div className="op-content"><div className="tag">Division {String(index+1).padStart(2,"0")}</div><h3>{row.division}</h3><p>{row.summary}</p></div></article>)}</div>;
}
