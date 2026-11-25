"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CurrencyValue } from "./CurrencyValue";

type LedgerRow = { id: string; effective_at: string; entry_type: string; source_type: string; amount: number; currency: string; description: string | null };
type BalanceRow = { currency: string; available_balance: number; invested_capital: number; accumulated_interest: number; total_account_value: number };
type IncomeRow = { currency: string; accrual_date: string; daily_income: number; cumulative_income: number };
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export default function InvestorStatement() {
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [income, setIncome] = useState<IncomeRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    (async () => {
      const db = getSupabaseBrowserClient();
      if (!db) { if (live) { setMessage("Statement service is unavailable."); setLoading(false); } return; }
      const [ledgerResult, balanceResult, incomeResult] = await Promise.all([
        db.from("investor_ledger_entries").select("id,effective_at,entry_type,source_type,amount,currency,description").order("effective_at", { ascending: false }).limit(5000),
        db.rpc("investor_get_account_balances"),
        db.rpc("investor_get_daily_income_history"),
      ]);
      if (!live) return;
      if (ledgerResult.error || balanceResult.error || incomeResult.error) setMessage("A verified account statement is unavailable until the ledger and earnings services are ready.");
      else { setLedger((ledgerResult.data || []) as LedgerRow[]); setBalances((balanceResult.data || []) as BalanceRow[]); setIncome((incomeResult.data || []) as IncomeRow[]); }
      setLoading(false);
    })();
    return () => { live = false; };
  }, []);
  function download() {
    const header = ["Effective date", "Entry type", "Source type", "Amount", "Currency", "Description"];
    const ledgerLines = ledger.map(row => [row.effective_at, row.entry_type, row.source_type, row.amount, row.currency, row.description || ""]);
    const incomeLines = income.map(row => [row.accrual_date, "Interest accrual", "Daily investment interest", row.daily_income, row.currency, `Cumulative recorded interest: ${row.cumulative_income}`]);
    const lines = [header, ...ledgerLines, ...incomeLines].slice(0, 10001);
    const csv = "\uFEFF" + lines.map(line => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `crystal-investor-statement-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className="portal-card" style={{ marginBottom: 18 }}>
    <div className="card-heading"><div><h3>Account statement</h3><p>Statements include posted ledger entries and recorded daily interest accruals. Pending requests and unverified payments are not treated as account credits.</p></div></div>
    {loading ? <p className="portal-empty">Loading verified ledger records…</p> : message ? <p className="portal-empty" role="status">{message}</p> : <>
      <div className="record-list"><h3>Recorded account balances</h3>{balances.length === 0 ? <p className="portal-empty">No posted account balance rows are available yet.</p> : balances.map(row => <div className="record-row" key={row.currency}><span><b>{row.currency} account value</b><small>Available: <CurrencyValue amount={Number(row.available_balance)} sourceCurrency={row.currency}/> · Invested: <CurrencyValue amount={Number(row.invested_capital)} sourceCurrency={row.currency}/> · Recorded interest: <CurrencyValue amount={Number(row.accumulated_interest)} sourceCurrency={row.currency}/></small></span><em><CurrencyValue amount={Number(row.total_account_value)} sourceCurrency={row.currency}/></em></div>)}</div>
      <div className="record-list"><h3>Daily interest history</h3>{income.length===0?<p className="portal-empty">No daily interest accruals have been recorded yet.</p>:income.slice(0,8).map(row=><div className="record-row" key={`${row.currency}-${row.accrual_date}`}><span><b>{row.currency} · {new Date(row.accrual_date).toLocaleDateString()}</b><small>Daily income: <CurrencyValue amount={Number(row.daily_income)} sourceCurrency={row.currency}/> · Cumulative: <CurrencyValue amount={Number(row.cumulative_income)} sourceCurrency={row.currency}/></small></span></div>)}</div>
      <div className="record-list"><h3>Posted ledger entries</h3>{ledger.length === 0 ? <p className="portal-empty">No posted ledger entries are available for a statement.</p> : ledger.slice(0, 8).map(row => <div className="record-row" key={row.id}><span><b>{row.entry_type} · <CurrencyValue amount={Number(row.amount)} sourceCurrency={row.currency}/></b><small>{row.source_type} · {row.description || "Ledger entry"} · {new Date(row.effective_at).toLocaleString()}</small></span></div>)}</div>
      <button className="button button-gold" type="button" onClick={download} disabled={ledger.length === 0 && income.length === 0}>Download account statement (CSV)</button>
    </>}
  </section>;
}
