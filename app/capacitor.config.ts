import type { CapacitorConfig } from "@capacitor/cli";

// Placeholder vaihetta 2 varten (ks. docs/architecture.md). Ei vielä
// käytössä build-pipeline-tasolla ennen kuin natiivialustat lisätään
// (`npx cap add android` / `npx cap add ios`).
const config: CapacitorConfig = {
  appId: "fi.paikkahalytin.app",
  appName: "Paikka-hälytin",
  webDir: "dist",
};

export default config;
