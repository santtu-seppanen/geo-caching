import { describe, it, expect } from "vitest";
import type { Paikka } from "../paikat/types";
import { nakyvatPaikat, nykyinenKohde } from "./pelimoodit";

function paikka(id: string, lat: number): Paikka {
  return { id, alue: "Äpätti", kuvaus: id, lat, lng: 25, kuva: `${id}.jpg` };
}

// ~1,1 km välein, ettei mikään ole toistensa 100 m säteellä.
const paikat = [paikka("apatti-1", 60), paikka("apatti-2", 60.01), paikka("apatti-3", 60.02)];
const kaukana = { lat: 61, lng: 25 };

describe("nykyinenKohde", () => {
  it("palauttaa ensimmäisen itse löytämättömän", () => {
    expect(nykyinenKohde(paikat, new Set(["apatti-1"]))?.id).toBe("apatti-2");
  });

  it("palauttaa null kun kaikki on löydetty", () => {
    expect(nykyinenKohde(paikat, new Set(paikat.map((p) => p.id)))).toBeNull();
  });
});

describe("nakyvatPaikat", () => {
  it("vapaassa moodissa näyttää kaikki", () => {
    expect(nakyvatPaikat("vapaa", paikat, new Set(), kaukana)).toHaveLength(3);
  });

  it("yksi kerrallaan näyttää löydetyt ja seuraavan", () => {
    const nakyvat = nakyvatPaikat("yksi-kerrallaan", paikat, new Set(["apatti-1"]), kaukana);
    expect(nakyvat.map((p) => p.id)).toEqual(["apatti-1", "apatti-2"]);
  });

  it("piilomoodeissa näyttää vain löydetyt", () => {
    const nakyvat = nakyvatPaikat("kolmiomittaus", paikat, new Set(["apatti-1"]), kaukana);
    expect(nakyvat.map((p) => p.id)).toEqual(["apatti-1"]);
  });

  it("piilomoodeissa paljastaa 100 m säteellä olevan kätkön", () => {
    const nakyvat = nakyvatPaikat("vihjeet", paikat, new Set(), { lat: 60.0205, lng: 25 });
    expect(nakyvat.map((p) => p.id)).toEqual(["apatti-3"]);
  });
});
