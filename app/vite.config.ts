import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { RuntimeCaching } from "workbox-build";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiUrl = env.VITE_LOYTO_API_URL;

  // Ilman käyttökelpoista Worker-URL:ia (esim. build ilman .env.local:ia)
  // jätetään runtime-caching-säännöt pois sen sijaan, että kaadetaan build.
  let runtimeCaching: RuntimeCaching[] = [];
  try {
    if (apiUrl) {
      const apiOrigin = new URL(apiUrl).origin;
      runtimeCaching = [
        {
          urlPattern: new RegExp(`^${apiOrigin}/(paikat|loydot)$`),
          handler: "NetworkFirst",
          options: {
            cacheName: "viinakatkoily-data",
            networkTimeoutSeconds: 4,
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
        {
          urlPattern: new RegExp(`^${apiOrigin}/kuvat/`),
          handler: "CacheFirst",
          options: {
            cacheName: "viinakatkoily-kuvat",
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
      ];
    }
  } catch {
    runtimeCaching = [];
  }

  return {
    base: "/geo-caching/",
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          runtimeCaching,
        },
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
  };
});
