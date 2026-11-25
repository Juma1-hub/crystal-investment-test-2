"use client";
import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SiteSettings = { contactEmail: string; contactPhone: string; headquarters: string; defaultCurrency: string; footerTagline: string };
type SiteContent = { homeEyebrow: string; homeDescription: string; aboutIntro: string; opportunitiesIntro: string };
const defaultSettings: SiteSettings = { contactEmail: "", contactPhone: "", headquarters: "Kenya", defaultCurrency: "KES", footerTagline: "Investing Today. Building Tomorrow." };
const defaultContent: SiteContent = {
  homeEyebrow: "A considered approach to investing",
  homeDescription: "We explore investment opportunities across sectors and markets, guided by disciplined evaluation, thoughtful capital allocation and a long-term perspective.",
  aboutIntro: "Headquartered in Kenya, Crystal Investments explores relevant opportunities around the world, across a diverse range of industries and markets.",
  opportunitiesIntro: "We consider opportunities worldwide, from operating businesses and real assets to infrastructure, technology and eligible financial markets."
};
export default function AdminSiteManager({ mode }: { mode: "settings" | "content" }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const db = getSupabaseBrowserClient();
      if (!db) { if (active) setSaved("Website settings are temporarily unavailable."); return; }
      const key = mode === "settings" ? "platform_settings" : "website_content";
      const { data, error } = await db.rpc("admin_get_site_configuration", { p_key: key });
      if (!active) return;
      if (error) { setSaved(`Could not load saved website configuration: ${error.message}`); return; }
      if (mode === "settings" && data) setSettings({ ...defaultSettings, ...(data as Partial<SiteSettings>), defaultCurrency: "KES" });
      if (mode === "content" && data) setContent({ ...defaultContent, ...(data as Partial<SiteContent>) });
    })();
    return () => { active = false; };
  }, [mode]);
  async function save(key: "platform_settings" | "website_content", value: SiteSettings | SiteContent) {
    const db = getSupabaseBrowserClient();
    if (!db) { setSaved("Unable to save these settings. Please try again."); return; }
    setBusy(true); setSaved("");
    const safeValue = key === "platform_settings" ? { ...(value as SiteSettings), defaultCurrency: "KES" } : value;
    const { error } = await db.rpc("admin_save_site_configuration", { p_key: key, p_value: safeValue });
    setBusy(false);
    if (error) { setSaved(`Could not save these settings: ${error.message}`); return; }
    setSaved(key === "platform_settings" ? "Platform settings saved." : "Website content saved.");
    window.dispatchEvent(new Event("crystal-site-configuration-change"));
  }
  function submitSettings(e: FormEvent<HTMLFormElement>) { e.preventDefault(); void save("platform_settings", settings); }
  function submitContent(e: FormEvent<HTMLFormElement>) { e.preventDefault(); void save("website_content", content); }
  if (mode === "settings") return <section className="admin-panel admin-site-manager"><h3>Platform settings</h3><p className="admin-help">Changes are securely saved and available across the platform.</p><form className="admin-site-form" onSubmit={submitSettings}>
    <label>Investor relations email<input type="email" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} placeholder="investors@yourdomain.com"/></label>
    <label>Contact telephone<input value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} placeholder="+254 ..."/></label>
    <label>Headquarters<input value={settings.headquarters} onChange={e => setSettings({ ...settings, headquarters: e.target.value })}/></label>
    <label>Default account currency<input value="KES" readOnly/></label>
    <label className="wide-field">Footer tagline<input value={settings.footerTagline} onChange={e => setSettings({ ...settings, footerTagline: e.target.value })}/></label>
    <button className="admin-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save platform settings"}</button>
  </form>{saved && <p className="admin-help" role="status">{saved}</p>}</section>;
  return <section className="admin-panel admin-site-manager"><h3>Website content</h3><p className="admin-help">Approved content is securely saved and published across the platform.</p><form className="admin-site-form" onSubmit={submitContent}>
    <label>Homepage eyebrow<input value={content.homeEyebrow} onChange={e => setContent({ ...content, homeEyebrow: e.target.value })}/></label>
    <label className="wide-field">Homepage introduction<textarea rows={3} value={content.homeDescription} onChange={e => setContent({ ...content, homeDescription: e.target.value })}/></label>
    <label className="wide-field">About page introduction<textarea rows={3} value={content.aboutIntro} onChange={e => setContent({ ...content, aboutIntro: e.target.value })}/></label>
    <label className="wide-field">Opportunities introduction<textarea rows={3} value={content.opportunitiesIntro} onChange={e => setContent({ ...content, opportunitiesIntro: e.target.value })}/></label>
    <button className="admin-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save website content"}</button>
  </form>{saved && <p className="admin-help" role="status">{saved}</p>}</section>;
}
