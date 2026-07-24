// src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ORIVENCE Surgical Instruments",
    short_name: "ORIVENCE",
    description: "World-class surgical-grade aesthetic implements. Micron-level precision forged in Tuttlingen, Germany.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#253237",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
  };
}
