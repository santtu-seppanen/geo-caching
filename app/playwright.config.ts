import { defineConfig } from "@playwright/test";

const PORT = 5199;

/**
 * E2E ajetaan tuotantobuildia (vite preview) vasten: Leaflet-merkkien klikit
 * eivät välity Vite-dev-palvelimella Playwrightissa, buildilla kyllä. Worker
 * mockataan reittitasolla (page.route), joten D1/R2/Cloudflare-tiliä ei
 * tarvita. Ks. e2e/loyto.e2e.ts. Ajo: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}/geo-caching/`,
    // Service worker ohittaisi page.route-mockit.
    serviceWorkers: "block",
    permissions: ["geolocation"],
    // Kartta tarvitsee selaimen oikeaa kokoa; mobiilikoko vastaa käyttöä.
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/geo-caching/`,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_LOYTO_API_URL: "http://api.test",
      VITE_LOYTO_SALASANA: "testi",
    },
  },
});
