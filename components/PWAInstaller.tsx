"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export default function PWAInstaller() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);
    const timer = window.setTimeout(() => setVisible(true), 6500);
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallPromptEvent); setVisible(true); };
    const onInstalled = () => { setVisible(false); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.clearTimeout(timer); window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") { setVisible(false); }
    setInstallEvent(null);
  }
  function dismiss() { setVisible(false); }
  if (!visible) return null;
  return <aside className="pwa-install-banner" role="dialog" aria-label="Install CRYSTAL INVESTMENTS app">
    <div className="pwa-install-copy"><span className="pwa-install-icon"><Download size={19}/></span><div><strong>Take CRYSTAL with you</strong><p>{installEvent ? "Install the app for quick access from your device." : ios ? "Add this website to your Home Screen using your browser’s Share menu, then choose Add to Home Screen." : "You can install this web app from your browser menu for quick access."}</p></div></div>
    <div className="pwa-install-actions">{installEvent && <button type="button" onClick={install}>Install app</button>}<button type="button" className="pwa-dismiss" onClick={dismiss} aria-label="Dismiss app installation suggestion"><X size={17}/></button></div>
  </aside>;
}
