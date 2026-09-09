import { describe, it, expect, beforeEach, vi } from "vitest";
import { haePaikat, tallennaPaikka, poistaPaikka } from "./api";
import type { Paikka } from "./types";

describe("paikat-API", () => {
  beforeEach(() => {
    // Tyhjennetään localStorage jokaisen testin alussa
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        for (const key in mockStorage) {
          delete mockStorage[key];
        }
      },
      length: 0,
      key: () => null,
    });
  });

  describe("haePaikat", () => {
    it("palauttaa tyhjän listan kun paikkoja ei ole", async () => {
      const paikat = await haePaikat();

      expect(paikat).toEqual([]);
    });

    it("palauttaa paikan joka on tallennettu", async () => {
      await tallennaPaikka({
        kuvaus: "Testi paikka",
        lat: 60.1699,
        lng: 24.9384,
      });

      const paikat = await haePaikat();

      expect(paikat).toHaveLength(1);
      expect(paikat[0]).toMatchObject({
        kuvaus: "Testi paikka",
        lat: 60.1699,
        lng: 24.9384,
        kuva_tiedosto: null,
      });
      expect(paikat[0].id).toBeDefined();
      expect(paikat[0].luotu).toBeDefined();
    });

    it("palauttaa paikat järjestyksessä uusin ensin", async () => {
      // Lisää kaksi paikkaa
      const vanhaPaikka = await tallennaPaikka({
        kuvaus: "Vanha paikka",
        lat: 60.1699,
        lng: 24.9384,
      });

      // Pieni viive varmistaaksemme että uusi on myöhemmin
      await new Promise((resolve) => setTimeout(resolve, 10));

      const uusiPaikka = await tallennaPaikka({
        kuvaus: "Uusi paikka",
        lat: 60.1699,
        lng: 24.9384,
      });

      const paikat = await haePaikat();

      expect(paikat).toHaveLength(2);
      expect(paikat[0].id).toBe(uusiPaikka.id);
      expect(paikat[1].id).toBe(vanhaPaikka.id);
    });
  });

  describe("tallennaPaikka", () => {
    it("tallentaa paikan ilman kuvaa", async () => {
      const paikka = await tallennaPaikka({
        kuvaus: "Uusi paikka",
        lat: 60.1699,
        lng: 24.9384,
      });

      expect(paikka).toMatchObject({
        kuvaus: "Uusi paikka",
        lat: 60.1699,
        lng: 24.9384,
        kuva_tiedosto: null,
      });
      expect(paikka.id).toBeDefined();
      expect(paikka.luotu).toBeDefined();

      // Varmista että se on tallennettu localStorage:een
      const paikat = await haePaikat();
      expect(paikat).toHaveLength(1);
      expect(paikat[0].id).toBe(paikka.id);
    });

    it("tallentaa paikan kuvalla", async () => {
      // Luodaan pieni testikuva (1x1 PNG)
      const pngData = Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0,
        0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73,
        68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 184, 0, 0,
        0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
      ]);

      const kuva = new File([pngData], "test.png", { type: "image/png" });

      const paikka = await tallennaPaikka({
        kuvaus: "Paikka kuvalla",
        lat: 60.1699,
        lng: 24.9384,
        kuva,
      });

      expect(paikka.kuva_tiedosto).toBeDefined();
      expect(typeof paikka.kuva_tiedosto).toBe("string");
      // data URL pitäisi alkaa "data:image/png;base64,"
      expect(paikka.kuva_tiedosto).toMatch(/^data:image\/png;base64,/);

      // Varmista että se on tallennettu localStorage:een
      const paikat = await haePaikat();
      expect(paikat).toHaveLength(1);
      expect(paikat[0].kuva_tiedosto).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("poistaPaikka", () => {
    it("poistaa paikan", async () => {
      const paikka1 = await tallennaPaikka({
        kuvaus: "Paikka 1",
        lat: 60.1699,
        lng: 24.9384,
      });

      // Pieni viive varmistamassa eri id:t
      await new Promise((resolve) => setTimeout(resolve, 10));

      const paikka2 = await tallennaPaikka({
        kuvaus: "Paikka 2",
        lat: 60.1699,
        lng: 24.9384,
      });

      await poistaPaikka(paikka1.id);

      const paikat = await haePaikat();

      expect(paikat).toHaveLength(1);
      expect(paikat[0].id).toBe(paikka2.id);
    });

    it("ei heida virhettä kun poistetaan tuntematon paikka", async () => {
      // Tämän pitäisi onnistua ilman virhettä
      await expect(poistaPaikka(99999)).resolves.toBeUndefined();

      const paikat = await haePaikat();
      expect(paikat).toHaveLength(0);
    });

    it("varmistaa että poisto on pysyvä", async () => {
      const paikka = await tallennaPaikka({
        kuvaus: "Paikka",
        lat: 60.1699,
        lng: 24.9384,
      });

      await poistaPaikka(paikka.id);

      // Hae uudelleen ja varmista että se on poissa
      const paikat = await haePaikat();
      expect(paikat).toHaveLength(0);
    });
  });
});
