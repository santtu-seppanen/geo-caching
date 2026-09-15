import { describe, it, expect } from "vitest";
import { etsiLaheisinAlue } from "./laheisinAlue";
import type { Paikka } from "../paikat/types";

function paikka(osittaiset: Partial<Paikka>): Paikka {
  return {
    id: "neittava-1",
    alue: "neittava",
    kuvaus: "",
    lat: 60.1699,
    lng: 24.9384,
    kuva: "",
    ...osittaiset,
  };
}

describe("etsiLaheisinAlue", () => {
  it("palauttaa null kun sijaintia ei tunneta", () => {
    expect(etsiLaheisinAlue([paikka({})], null)).toBeNull();
  });

  it("palauttaa null kun mikään kätkö ei ole kynnyksen sisällä", () => {
    // Noin 3.3 km päässä (0.03 astetta ~ 3300 m)
    const kaukainen = paikka({ id: "neittava-1", lat: 60.1699 + 0.03 });
    const sijainti = { lat: 60.1699, lng: 24.9384 };

    expect(etsiLaheisinAlue([kaukainen], sijainti)).toBeNull();
  });

  it("löytää lähellä olevan kätkön alueen sen id:n tekstiosasta", () => {
    // Noin 550 m päässä (0.005 astetta ~ 550 m)
    const lahella = paikka({ id: "neittava-2", lat: 60.1699 + 0.005 });
    const sijainti = { lat: 60.1699, lng: 24.9384 };

    const tulos = etsiLaheisinAlue([lahella], sijainti);

    expect(tulos?.alue).toBe("neittava");
    expect(tulos?.etaisyysMetreina).toBeGreaterThan(400);
    expect(tulos?.etaisyysMetreina).toBeLessThan(700);
  });

  it("valitsee useista kynnyksen sisällä olevista alueista lähimmän", () => {
    const sijainti = { lat: 60.1699, lng: 24.9384 };
    const kauempana = paikka({ id: "toppila-1", alue: "toppila", lat: 60.1699 + 0.015 });
    const lahempana = paikka({ id: "neittava-1", alue: "neittava", lat: 60.1699 + 0.005 });

    const tulos = etsiLaheisinAlue([kauempana, lahempana], sijainti);

    expect(tulos?.alue).toBe("neittava");
  });
});
