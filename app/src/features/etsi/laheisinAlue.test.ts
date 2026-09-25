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

  it("löytää lähimmän alueen myös kynnyksen ulkopuolelta, mutta ei merkitse sitä avattavaksi", () => {
    // Noin 3.3 km päässä (0.03 astetta ~ 3300 m) — ALUE_AVAUTUU_METREINA on 2000 m
    const kaukainen = paikka({ id: "neittava-1", lat: 60.1699 + 0.03 });
    const sijainti = { lat: 60.1699, lng: 24.9384 };

    const tulos = etsiLaheisinAlue([kaukainen], sijainti);

    expect(tulos?.alue).toBe("neittava");
    expect(tulos?.avautuuKartalle).toBe(false);
  });

  it("löytää lähellä olevan kätkön alueen sen id:n tekstiosasta ja merkitsee sen avattavaksi", () => {
    // Noin 550 m päässä (0.005 astetta ~ 550 m)
    const lahella = paikka({ id: "neittava-2", lat: 60.1699 + 0.005 });
    const sijainti = { lat: 60.1699, lng: 24.9384 };

    const tulos = etsiLaheisinAlue([lahella], sijainti);

    expect(tulos?.alue).toBe("neittava");
    expect(tulos?.etaisyysMetreina).toBeGreaterThan(400);
    expect(tulos?.etaisyysMetreina).toBeLessThan(700);
    // Kätkö on suoraan pohjoisessa (suurempi lat, sama lng)
    expect(tulos?.suuntimaAsteina).toBeCloseTo(0, 0);
    expect(tulos?.avautuuKartalle).toBe(true);
  });

  it("palauttaa kätkön oman alue-kentän ihmisluettavaksi nimeksi, ääkköset säilyttäen", () => {
    const lahella = paikka({ id: "apatti-1", alue: "Äpätti", lat: 60.1699 + 0.005 });
    const sijainti = { lat: 60.1699, lng: 24.9384 };

    const tulos = etsiLaheisinAlue([lahella], sijainti);

    expect(tulos?.alue).toBe("apatti");
    expect(tulos?.nimi).toBe("Äpätti");
  });

  it("ohittaa piilotaLahimmasta-kätkön ja valitsee seuraavaksi lähimmän", () => {
    const sijainti = { lat: 60.1699, lng: 24.9384 };
    const piilotettu = paikka({
      id: "neittava-1",
      alue: "neittava",
      lat: 60.1699 + 0.005,
      piilotaLahimmasta: true,
    });
    const kauempana = paikka({ id: "toppila-1", alue: "toppila", lat: 60.1699 + 0.03 });

    const tulos = etsiLaheisinAlue([piilotettu, kauempana], sijainti);

    expect(tulos?.alue).toBe("toppila");
  });

  it("palauttaa null jos ainoa kätkö on piilotaLahimmasta", () => {
    const sijainti = { lat: 60.1699, lng: 24.9384 };
    const piilotettu = paikka({ piilotaLahimmasta: true });

    expect(etsiLaheisinAlue([piilotettu], sijainti)).toBeNull();
  });

  it("valitsee useista alueista lähimmän, vaikka kaikki olisivat kynnyksen ulkopuolella", () => {
    const sijainti = { lat: 60.1699, lng: 24.9384 };
    const kauempana = paikka({ id: "toppila-1", alue: "toppila", lat: 60.1699 + 0.05 });
    const lahempana = paikka({ id: "neittava-1", alue: "neittava", lat: 60.1699 + 0.03 });

    const tulos = etsiLaheisinAlue([kauempana, lahempana], sijainti);

    expect(tulos?.alue).toBe("neittava");
    expect(tulos?.avautuuKartalle).toBe(false);
  });
});
