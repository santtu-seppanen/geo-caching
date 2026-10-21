import { describe, it, expect } from "vitest";
import { laskeOhitukset } from "./ohitukset";
import { AJASTETTU_HAKU_MS } from "./pelimoodit";
import { ETSINTA_MAX_MS } from "./etsinta";
import type { Alue } from "../paikat/alueet";
import type { Loyto, Paikka } from "../paikat/types";

const paikka = (id: string) => ({ id, alue: "Neittävä", kuvaus: "", lat: 0, lng: 0, kuva: "" }) as Paikka;
const alue: Alue = {
  alue: "neittava",
  nimi: "Neittävä",
  keskipiste: { lat: 0, lng: 0 },
  paikat: [paikka("n-1"), paikka("n-2"), paikka("n-3")],
};
const AJASTETTU = new Map([["neittava", "ajastettu" as const]]);
const ALKU = 10_000_000;
const loyto = (paikkaId: string, aika: number, nimi = "Matti"): Loyto => ({ paikkaId, nimi, aika: new Date(aika).toISOString() });
const laske = (o: { pelimoodit?: typeof AJASTETTU; loydot?: Loyto[]; alkoi?: number | null; nyt: number; nimi?: string }) =>
  laskeOhitukset([alue], o.pelimoodit ?? AJASTETTU, o.loydot ?? [], o.nimi ?? "Matti", () => (o.alkoi === undefined ? ALKU : o.alkoi), o.nyt);

describe("laskeOhitukset", () => {
  it("ei ohituksia kun ensimmäisen kätkön aika on käynnissä", () => {
    expect(laske({ nyt: ALKU + 60_000 })).toEqual([{ alue: "Neittävä", ohitettu: 0, yhteensa: 3 }]);
  });

  it("laskee ohitetut kätköt kun aika loppuu ilman löytöä", () => {
    expect(laske({ nyt: ALKU + 2 * AJASTETTU_HAKU_MS + 1 })[0].ohitettu).toBe(2);
  });

  it("omalla ajoissa tehty löytö ei ole ohitus, toisen pelaajan löytö ei auta", () => {
    const nyt = ALKU + 2 * AJASTETTU_HAKU_MS + 1;
    expect(laske({ nyt, loydot: [loyto("n-1", ALKU + 60_000)] })[0].ohitettu).toBe(1);
    expect(laske({ nyt, loydot: [loyto("n-1", ALKU + 60_000, "Liisa")] })[0].ohitettu).toBe(2);
  });

  it("ohittaa muut moodit, aloittamattomat ja takarajan ylittäneet etsinnät", () => {
    const nyt = ALKU + AJASTETTU_HAKU_MS * 2;
    expect(laske({ nyt, pelimoodit: new Map() })).toEqual([]);
    expect(laske({ nyt, alkoi: null })).toEqual([]);
    expect(laske({ nyt: ALKU + ETSINTA_MAX_MS + 1 })).toEqual([]);
  });

  it("uusi aloitus nollaa ohitukset", () => {
    const nyt = ALKU + 2 * AJASTETTU_HAKU_MS + 1;
    expect(laske({ nyt, alkoi: nyt - 1000 })[0].ohitettu).toBe(0);
  });
});
