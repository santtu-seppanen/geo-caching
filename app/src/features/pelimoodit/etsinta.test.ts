import { describe, it, expect } from "vitest";
import type { Paikka } from "../paikat/types";
import { ETSINTA_MAX_MS, etsinnanEteneminen, etsintaKaynnissa, loytoajastimenAlku } from "./etsinta";
import { AJASTETTU_HAKU_MS } from "./pelimoodit";

function paikka(id: string): Paikka {
  return { id, alue: "Äpätti", kuvaus: id, lat: 60, lng: 25, kuva: `${id}.jpg` };
}

const paikat = [paikka("a-1"), paikka("a-2"), paikka("a-3")];
const ALKU = 1_000_000;
const MIN = 60_000;

describe("etsinnanEteneminen", () => {
  it("ajastetussa haussa ei kohdetta ennen aloitusta", () => {
    expect(etsinnanEteneminen("ajastettu", paikat, new Map(), null, ALKU).kohde).toBeNull();
  });

  it("vihjeissä kohde näkyy ennen aloitusta, mutta vuoro ei ole alkanut", () => {
    const tila = etsinnanEteneminen("vihjeet", paikat, new Map(), null, ALKU);
    expect(tila.kohde?.id).toBe("a-1");
    expect(tila.vuoroAlkoi).toBeNull();
  });

  it("ensimmäisen kohteen vuoro alkaa aloituksesta", () => {
    const tila = etsinnanEteneminen("ajastettu", paikat, new Map(), ALKU, ALKU + MIN);
    expect(tila.kohde?.id).toBe("a-1");
    expect(tila.vuoroAlkoi).toBe(ALKU);
  });

  it("löytö aloittaa seuraavan vuoron löytöhetkestä", () => {
    const tila = etsinnanEteneminen("ajastettu", paikat, new Map([["a-1", ALKU + 2 * MIN]]), ALKU, ALKU + 3 * MIN);
    expect(tila.kohde?.id).toBe("a-2");
    expect(tila.vuoroAlkoi).toBe(ALKU + 2 * MIN);
  });

  it("ajan loputtua kohde ohitetaan ja seuraava alkaa aikarajasta", () => {
    const tila = etsinnanEteneminen("ajastettu", paikat, new Map(), ALKU, ALKU + AJASTETTU_HAKU_MS + MIN);
    expect(tila.kohde?.id).toBe("a-2");
    expect(tila.vuoroAlkoi).toBe(ALKU + AJASTETTU_HAKU_MS);
    expect([...tila.ohitetutIdt]).toEqual(["a-1"]);
  });

  it("aika kuluu putkeen, vaikka sovellus olisi ollut kiinni", () => {
    const tila = etsinnanEteneminen("ajastettu", paikat, new Map(), ALKU, ALKU + 60 * MIN);
    expect(tila.kohde).toBeNull();
    expect(tila.ohitetutIdt.size).toBe(3);
  });

  it("ennen etsintää löydetyt ohitetaan, ja uusi aloitus käy loput alusta", () => {
    const loydot = new Map([["a-1", ALKU - 10 * MIN]]);
    const tila = etsinnanEteneminen("ajastettu", paikat, loydot, ALKU, ALKU + MIN);
    expect(tila.kohde?.id).toBe("a-2");
    expect(tila.ohitetutIdt.size).toBe(0);
  });

  it("vihjeissä vuoro ei vanhene", () => {
    const tila = etsinnanEteneminen("vihjeet", paikat, new Map(), ALKU, ALKU + 60 * MIN);
    expect(tila.kohde?.id).toBe("a-1");
    expect(tila.vuoroAlkoi).toBe(ALKU);
  });
});

describe("etsintaKaynnissa", () => {
  it("ei ole käynnissä ennen aloitusta", () => {
    expect(etsintaKaynnissa(null, ALKU)).toBe(false);
  });

  it("päättyy tasan takarajalla", () => {
    expect(etsintaKaynnissa(ALKU, ALKU + ETSINTA_MAX_MS - 1)).toBe(true);
    expect(etsintaKaynnissa(ALKU, ALKU + ETSINTA_MAX_MS)).toBe(false);
  });
});

describe("loytoajastimenAlku", () => {
  it("on null ilman aloitusta", () => {
    expect(loytoajastimenAlku(new Map(), null)).toBeNull();
  });

  it("on aloitus ennen ensimmäistä löytöä", () => {
    expect(loytoajastimenAlku(new Map([["a-1", ALKU - MIN]]), ALKU)).toBe(ALKU);
  });

  it("on viimeisin löytö aloituksen jälkeen", () => {
    expect(loytoajastimenAlku(new Map([["a-1", ALKU + MIN], ["a-3", ALKU + 4 * MIN]]), ALKU)).toBe(ALKU + 4 * MIN);
  });
});
