import { describe, it, expect } from "vitest";
import { etaisyysMetreina } from "../etsi/distance";
import {
  avautuneitaVihjeita,
  mitattuEtaisyys,
  seuraavaanVihjeeseenMs,
  vihjeYmpyranKeskipiste,
  VIHJE_TASOT,
} from "./vihjeet";

const MINUUTTI = 60_000;

describe("vihjeiden ajastus", () => {
  it("ensimmäinen vihje avautuu heti", () => {
    expect(avautuneitaVihjeita(0, 0)).toBe(1);
    expect(seuraavaanVihjeeseenMs(0, 0)).toBe(5 * MINUUTTI);
  });

  it("vihjeet avautuvat odotusajan jälkeen", () => {
    expect(avautuneitaVihjeita(0, 5 * MINUUTTI)).toBe(2);
    expect(seuraavaanVihjeeseenMs(0, 7 * MINUUTTI)).toBe(3 * MINUUTTI);
  });

  it("vihjeitä on rajattu määrä", () => {
    expect(avautuneitaVihjeita(0, 999 * MINUUTTI)).toBe(VIHJE_TASOT.length);
    expect(seuraavaanVihjeeseenMs(0, 999 * MINUUTTI)).toBeNull();
  });
});

describe("vihjeYmpyranKeskipiste", () => {
  const paikka = { id: "apatti-1", lat: 60.5, lng: 25.1 };

  it("kätkö on aina ympyrän sisällä, mutta ei keskellä", () => {
    VIHJE_TASOT.forEach((taso, indeksi) => {
      const etaisyys = etaisyysMetreina(vihjeYmpyranKeskipiste(paikka, indeksi), paikka);
      expect(etaisyys).toBeLessThan(taso.sadeMetreina);
    });
  });

  it("on deterministinen", () => {
    expect(vihjeYmpyranKeskipiste(paikka, 1)).toEqual(vihjeYmpyranKeskipiste(paikka, 1));
  });
});

describe("mitattuEtaisyys", () => {
  it("pyöristää 10 metriin", () => {
    expect(mitattuEtaisyys({ lat: 60, lng: 25 }, { lat: 60.001, lng: 25 }) % 10).toBe(0);
  });
});
