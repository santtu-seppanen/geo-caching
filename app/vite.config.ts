import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/geo-caching/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Viinakätköily",
        short_name: "Viinakätköily",
        description: "Etsi kätköjä lähelläsi ja merkitse löydöt.",
        start_url: "/geo-caching/",
        scope: "/geo-caching/",
        display: "standalone",
        theme_color: "#2f6b4f",
        background_color: "#fff2de",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
});
