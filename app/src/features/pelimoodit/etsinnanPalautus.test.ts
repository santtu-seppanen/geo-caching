import { describe, it, expect } from "vitest";
import { palautettavatEtsinnat } from "./etsinnanPalautus";
import { ETSINTA_MAX_MS } from "./etsinta";
import type { KaynnissaOlevaEtsinta } from "./etsinnatApi";

const NYT = Date.parse("2026-10-21T12:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();
const etsinta = (o: Partial<KaynnissaOlevaEtsinta>): KaynnissaOlevaEtsinta => ({
  alueAvain: "neittava",
  nimi: "Matti",
  alkoi: iso(NYT - 600_000),
  sijainti: null,
  ...o,
});
const eiPaikallista = () => null;

describe("palautettavatEtsinnat", () => {
  it("palauttaa saman nimimerkin etsinnän, jota laitteella ei ole", () => {
    expect(palautettavatEtsinnat([etsinta({})], "Matti", eiPaikallista, NYT)).toEqual([
      { alueAvain: "neittava", alkoi: NYT - 600_000 },
    ]);
  });

  it("nimimerkki vertautuu kirjainkoosta ja ympäröivistä välilyönneistä riippumatta", () => {
    expect(palautettavatEtsinnat([etsinta({ nimi: "MATTI" })], "  matti ", eiPaikallista, NYT)).toHaveLength(1);
  });

  it("ohittaa toisen pelaajan, nimettömän ja tyhjällä nimellä haun", () => {
    const rivit = [etsinta({ nimi: "Liisa" }), etsinta({ nimi: null })];
    expect(palautettavatEtsinnat(rivit, "Matti", eiPaikallista, NYT)).toEqual([]);
    expect(palautettavatEtsinnat([etsinta({})], "  ", eiPaikallista, NYT)).toEqual([]);
  });

  it("uusin aloitus voittaa kun samalle alueelle on useita rivejä (eri laitteet)", () => {
    const rivit = [etsinta({ alkoi: iso(NYT - 900_000) }), etsinta({ alkoi: iso(NYT - 300_000) })];
    expect(palautettavatEtsinnat(rivit, "Matti", eiPaikallista, NYT)[0].alkoi).toBe(NYT - 300_000);
  });

  it("ei korvaa laitteen uudempaa tai yhtä uutta aloitusta, mutta korvaa vanhemman", () => {
    const rivit = [etsinta({ alkoi: iso(NYT - 600_000) })];
    expect(palautettavatEtsinnat(rivit, "Matti", () => NYT - 600_000, NYT)).toEqual([]);
    expect(palautettavatEtsinnat(rivit, "Matti", () => NYT - 60_000, NYT)).toEqual([]);
    expect(palautettavatEtsinnat(rivit, "Matti", () => NYT - 900_000, NYT)).toHaveLength(1);
  });

  it("ohittaa takarajan ylittäneen ja virheellisen aloitusajan", () => {
    const vanha = etsinta({ alkoi: iso(NYT - ETSINTA_MAX_MS - 1) });
    const rikki = etsinta({ alueAvain: "toinen", alkoi: "eilen" });
    expect(palautettavatEtsinnat([vanha, rikki], "Matti", eiPaikallista, NYT)).toEqual([]);
  });

  it("käsittelee alueet erikseen", () => {
    const rivit = [etsinta({}), etsinta({ alueAvain: "apatti" })];
    expect(palautettavatEtsinnat(rivit, "Matti", (a) => (a === "apatti" ? NYT : null), NYT).map((p) => p.alueAvain)).toEqual(["neittava"]);
  });
});
