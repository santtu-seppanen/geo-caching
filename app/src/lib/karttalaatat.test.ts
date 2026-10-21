// @vitest-environment node
import { describe, it, expect } from "vitest";
import { LAATTA_ATTRIBUUTIO, LAATTA_MAX_ZOOM, LAATTA_URL, LAATTA_VALIMUISTI } from "./karttalaatat";
import { readFileSync } from "node:fs";

describe("karttalaatat (OSM-käyttöehdot)", () => {
  it("käyttää vakiopalvelua ilman vanhentuneita {s}-alidomaineja", () => {
    expect(LAATTA_URL).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(LAATTA_URL).not.toContain("{s}");
  });

  it("attribuutio linkittää OSM:n tekijänoikeussivulle", () => {
    expect(LAATTA_ATTRIBUUTIO).toContain("https://www.openstreetmap.org/copyright");
    expect(LAATTA_ATTRIBUUTIO).toContain("OpenStreetMap");
  });

  it("välimuisti on rajattu: enintään 7 vrk ja kohtuullinen määrä laattoja", () => {
    expect(LAATTA_VALIMUISTI.maxAgeSeconds).toBeLessThanOrEqual(7 * 24 * 60 * 60);
    expect(LAATTA_VALIMUISTI.maxEntries).toBeLessThanOrEqual(500);
    expect(LAATTA_MAX_ZOOM).toBe(19);
  });

  it("kaikki kartat käyttävät jaettuja vakioita eikä kovakoodattua laatta-URL:ia", () => {
    for (const tiedosto of ["../features/paikat/Aluesivu.tsx", "../features/tilannekuva/Tilannekuva.tsx"]) {
      const lahde = readFileSync(new URL(tiedosto, import.meta.url), "utf8");
      expect(lahde, tiedosto).toContain("LAATTA_URL");
      expect(lahde, tiedosto).toContain("LAATTA_ATTRIBUUTIO");
      expect(lahde, tiedosto).not.toContain("tile.openstreetmap.org");
    }
  });

  it("service worker -välimuisti on konfiguroitu vain on-demand, ilman esilatausta", () => {
    const konfiguraatio = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
    expect(konfiguraatio).toContain("LAATTA_VALIMUISTI");
    expect(konfiguraatio).toContain('"CacheFirst"');
    expect(konfiguraatio).not.toMatch(/precache.*tile|tile.*precache/i);
  });
});
