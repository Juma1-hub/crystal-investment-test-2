import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CRYSTAL INVESTMENTS",
    short_name: "CRYSTAL",
    description: "CRYSTAL INVESTMENTS — Investing Today. Building Tomorrow.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f8fa",
    theme_color: "#102a36",
    categories: ["finance", "business"],
    icons: [
      { src: "/icons/crystal-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/crystal-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/crystal-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
