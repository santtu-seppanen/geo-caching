import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Playwright-testit (e2e/) ajetaan erikseen: npm run test:e2e.
    exclude: ["e2e/**", "node_modules/**"],
  },
});
