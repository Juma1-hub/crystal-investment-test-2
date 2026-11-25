"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import BrandMark from "./BrandMark";
import { getSupabaseBrowserClient } from "@/lib/supabase";

const links = [
  { label: "Home", href: "/" }, { label: "About", href: "/about" },
  { label: "Divisions", href: "/divisions" }, { label: "Opportunities", href: "/opportunities" },
  { label: "Our Approach", href: "/approach" }, { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
];
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    const refresh = async (session: any) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      if (!session) { setIsAdmin(false); return; }
      const { data, error } = await supabase.rpc("crystal_admin_access");
      if (active) setIsAdmin(!error && Boolean(data?.role) && ["Supa Admin", "Junior Admin"].includes(data.role));
    };
    void supabase.auth.getSession().then(({ data }) => refresh(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (!session) { setIsAdmin(false); return; }
      window.setTimeout(() => { void refresh(session); }, 0);
    });
    const onSessionChange = () => { void supabase.auth.getSession().then(({ data }) => refresh(data.session)); };
    window.addEventListener("crystal-session-change", onSessionChange);
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener("crystal-session-change", onSessionChange); };
  }, []);
  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    setSignedIn(false); setIsAdmin(false); setOpen(false);
    window.dispatchEvent(new Event("crystal-session-change"));
    window.location.href = "/";
  }
  return <header className="site-header"><div className="container nav-wrap">
    <Link href="/" className="brand" onClick={() => setOpen(false)}><BrandMark/><span><strong>CRYSTAL</strong><small>INVESTMENTS</small></span></Link>
    <button className="menu-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "main-nav is-open" : "main-nav"}>
      {links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
      {signedIn ? <>
        <Link className="nav-login" href="/investor" onClick={() => setOpen(false)}>Investor's Dash</Link>
        {isAdmin && <Link className="nav-admin-button" href="/admin" onClick={() => setOpen(false)}><ShieldCheck size={15}/> Admin Panel</Link>}
        <button className="nav-session-button" onClick={signOut}>Log out</button>
      </> : <>
        <Link className="nav-login" href="/login" onClick={() => setOpen(false)}>Investor Login</Link>
        <Link className="button button-gold nav-cta" href="/register" onClick={() => setOpen(false)}>Become an Investor <span>↗</span></Link>
      </>}
    </nav>
  </div></header>;
}
