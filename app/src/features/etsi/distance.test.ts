import { describe, it, expect } from "vitest";
import { etaisyysMetreina, etenemisprosentti } from "./distance";

describe("etaisyysMetreina", () => {
  it("palauttaa 0 kun pisteet ovat samat", () => {
    const piste = { lat: 60.1699, lng: 24.9384 };
    const etaisyys = etaisyysMetreina(piste, piste);

    expect(etaisyys).toBe(0);
  });

  it("laskee oikean etäisyyden kahden koordinaatin välillä", () => {
    // Helsinki ja Tampere (noin 170 km päässä)
    const helsinki = { lat: 60.1699, lng: 24.9384 };
    const tampere = { lat: 61.4978, lng: 23.761 };

    const etaisyys = etaisyysMetreina(helsinki, tampere);

    // Etäisyys pitäisi olla noin 155-170 km (Haversine on arvio)
    expect(etaisyys).toBeGreaterThan(155000);
    expect(etaisyys).toBeLessThan(170000);
  });

  it("laskee oikean etäisyyden kun pisteet ovat lähellä", () => {
    // Kaksi pistettä 1 km:n päässä (noin 0.01 asteen päässä)
    const piste1 = { lat: 60.1699, lng: 24.9384 };
    const piste2 = { lat: 60.1699 + 0.009, lng: 24.9384 };

    const etaisyys = etaisyysMetreina(piste1, piste2);

    // Etäisyys pitäisi olla noin 1000 metriä (toleranssi +/- 100 m)
    expect(etaisyys).toBeGreaterThan(900);
    expect(etaisyys).toBeLessThan(1100);
  });

  it("laskee oikean etäisyyden eri puolille maapalloa", () => {
    // Pohjoinen navalla ja suomalaisella paikkakunnalla
    const pohjoisnapa = { lat: 90, lng: 0 };
    const suomi = { lat: 60, lng: 25 };

    const etaisyys = etaisyysMetreina(pohjoisnapa, suomi);

    // Noin 3333 km
    expect(etaisyys).toBeGreaterThan(3300000);
    expect(etaisyys).toBeLessThan(3400000);
  });
});

describe("etenemisprosentti", () => {
  it("palauttaa 1 kynnyksen sisällä", () => {
    expect(etenemisprosentti(500, 2000, 10000)).toBe(1);
    expect(etenemisprosentti(2000, 2000, 10000)).toBe(1);
  });

  it("palauttaa 0 kantaman päässä tai kauempana", () => {
    expect(etenemisprosentti(10000, 2000, 10000)).toBe(0);
    expect(etenemisprosentti(50000, 2000, 10000)).toBe(0);
  });

  it("interpoloi lineaarisesti kynnyksen ja kantaman välillä", () => {
    expect(etenemisprosentti(6000, 2000, 10000)).toBeCloseTo(0.5);
  });
});
