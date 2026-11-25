"use client";
import { useEffect, useState } from "react";
export function CurrencyValue({ amount = 0, sourceCurrency = "KES" }: { amount?: number; sourceCurrency?: string }) {
  const [displayCurrency, setDisplayCurrency] = useState("KES");
  useEffect(() => {
    const sync = (event: Event) => { const value = (event as CustomEvent<string>).detail; if (value) setDisplayCurrency(value); };
    window.addEventListener("crystal-currency-change", sync);
    return () => window.removeEventListener("crystal-currency-change", sync);
  }, []);
  const formatted = `${sourceCurrency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return <span title={sourceCurrency === displayCurrency ? undefined : `Recorded in ${sourceCurrency}. A verified ${displayCurrency} conversion rate is not available, so the original currency is shown.`}>{formatted}</span>;
}
