"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
export default function SiteContentText({ field, fallback }: { field: string; fallback: string }) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    let active = true;
    const sync = async () => {
      const db = getSupabaseBrowserClient();
      if (!db) { if (active) setValue(fallback); return; }
      const { data, error } = await db.rpc("crystal_get_public_site_configuration");
      if (!active || error) return;
      const text = data?.website_content?.[field];
      setValue(typeof text === "string" && text.trim() ? text : fallback);
    };
    void sync();
    window.addEventListener("crystal-site-configuration-change", sync);
    return () => { active = false; window.removeEventListener("crystal-site-configuration-change", sync); };
  }, [field, fallback]);
  return <>{value}</>;
}
