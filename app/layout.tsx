import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PWAInstaller from "@/components/PWAInstaller";

export const metadata: Metadata = {
  title: "Crystal Investments | Investing Today. Building Tomorrow.",
  description: "Explore the investment philosophy, divisions and opportunities of Crystal Investments.",
  applicationName: "CRYSTAL INVESTMENTS",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CRYSTAL" },
  icons: {
    icon: [{ url: "/icons/crystal-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/crystal-192.png", sizes: "192x192", type: "image/png" }]
  }
};
export const viewport: Viewport = { themeColor: "#102a36", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/><PWAInstaller/></body></html>;
}
