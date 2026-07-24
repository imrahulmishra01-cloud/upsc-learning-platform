import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UPSC Prep Platform",
    short_name: "UPSC Prep",
    description: "Self-hosted UPSC preparation platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
