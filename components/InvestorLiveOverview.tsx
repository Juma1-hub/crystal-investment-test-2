"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Balance = { currency: string; available_balance: number; invested_capital: number; accumulated_interest: number; total_account_value: number };
type DailyIncome = { currency: string; latest_accrual_date: string | null; latest_daily_income: number; total_recorded_income: number };
const fmt = (n: number, c: string) => `${c} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const zeroBalance: Balance = { currency: "KES", available_balance: 0, invested_capital: 0, accumulated_interest: 0, total_account_value: 0 };
const zeroIncome: DailyIncome = { currency: "KES", latest_accrual_date: null, latest_daily_income: 0, total_recorded_income: 0 };

export default function InvestorLiveOverview() {
  const [rows, setRows] = useState<Balance[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyIncome[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dailyFailed, setDailyFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const db = getSupabaseBrowserClient();
    if (!db) { setFailed(true); setDailyFailed(true); setLoaded(true); return; }
    void Promise.all([db.rpc("investor_get_account_balances"), db.rpc("investor_get_daily_income_summary")]).then(([balances, income]) => {
      if (!live) return;
      if (balances.error) setFailed(true); else setRows(Array.isArray(balances.data) ? balances.data as Balance[] : []);
      if (income.error) setDailyFailed(true); else setDailyRows(Array.isArray(income.data) ? income.data as DailyIncome[] : []);
      setLoaded(true);
    });
    return () => { live = false; };
  }, []);

  if (!loaded) return <section className="investor-grid" aria-label="Investor account values"><article className="portal-card income-panel"><p className="portal-empty">Loading account balances…</p></article></section>;
  if (failed) return <section className="investor-grid" aria-label="Investor account values"><article className="portal-card income-panel"><p className="portal-empty">Your account balances could not be loaded. Please refresh or contact support. No estimated balance is displayed.</p></article></section>;

  const kesRow = rows.find(row => row.currency === "KES") || zeroBalance;
  const displayRows = [kesRow, ...rows.filter(row => row.currency !== "KES")];
  return <section className="investor-grid" aria-label="Investor account values">
    {displayRows.map(row => {
      const income = dailyRows.find(item => item.currency === row.currency) || (row.currency === "KES" ? zeroIncome : null);
      return <article className="portal-card income-panel" key={row.currency}>
        <div className="card-heading"><div><span className="eyebrow">{row.currency} ACCOUNT</span><h3>{fmt(row.total_account_value, row.currency)}</h3></div></div>
        <div className="admin-metric-row"><span>Available balance</span><b>{fmt(row.available_balance, row.currency)}</b></div>
        <div className="admin-metric-row"><span>Invested capital</span><b>{fmt(row.invested_capital, row.currency)}</b></div>
        <div className="admin-metric-row"><span>Accumulated earnings</span><b>{fmt(row.accumulated_interest, row.currency)}</b></div>
        {dailyFailed ? <p className="admin-help">Recorded daily income is temporarily unavailable.</p> : <>
          <div className="admin-metric-row"><span>Latest daily income{income?.latest_accrual_date ? ` · ${new Date(`${income.latest_accrual_date}T00:00:00`).toLocaleDateString()}` : ""}</span><b>{fmt(Number(income?.latest_daily_income || 0), row.currency)}</b></div>
          <div className="admin-metric-row"><span>Total recorded daily income</span><b>{fmt(Number(income?.total_recorded_income || 0), row.currency)}</b></div>
        </>}
      </article>;
    })}
  </section>;
}
