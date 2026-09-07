import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Paikka-hälytin",
        short_name: "Paikka-hälytin",
        description: "Tallenna paikkoja ja saa hälytys, kun olet lähellä.",
        start_url: "/",
        display: "standalone",
        theme_color: "#1d4ed8",
        background_color: "#ffffff",
        icons: [],
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
