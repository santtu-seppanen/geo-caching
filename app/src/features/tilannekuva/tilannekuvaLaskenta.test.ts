import { describe, it, expect } from "vitest";
import { ryhmitteleAlueiksi, yhdistaKaikkiSamannimiset } from "../paikat/alueet";
import type { Loyto, Paikka } from "../paikat/types";
import { ETSINTA_MAX_MS } from "../pelimoodit/etsinta";
import { etsintaRivit, katkoRivit, muotoileIka, muotoileKesto, ryhmitteleAlueittain, valitseAlue } from "./tilannekuvaLaskenta";

function paikka(id: string, alue: string): Paikka {
  return { id, alue, kuvaus: "", lat: 60, lng: 25, kuva: "" };
}

const paikat = [paikka("apatti-1", "Äpätti"), paikka("apatti-2", "Äpätti"), paikka("neittava-1", "Neittävä")];
const alueet = yhdistaKaikkiSamannimiset(ryhmitteleAlueiksi(paikat));
const NYT = Date.parse("2026-10-21T12:00:00Z");
const iso = (minuuttiaSitten: number) => new Date(NYT - minuuttiaSitten * 60_000).toISOString();

describe("valitseAlue", () => {
  const etsinnat = [
    { alueAvain: "neittava", nimi: "A", alkoi: iso(30), sijainti: null },
    { alueAvain: "apatti", nimi: "B", alkoi: iso(20), sijainti: null },
    { alueAvain: "apatti", nimi: "C", alkoi: iso(10), sijainti: null },
  ];

  it("valitsee alueen, jolla on eniten etsintöjä", () => {
    expect(valitseAlue(alueet, null, etsinnat)?.nimi).toBe("Äpätti");
  });

  it("tasatilanteessa tuoreimman aloituksen alueen", () => {
    expect(valitseAlue(alueet, null, etsinnat.slice(0, 2))?.nimi).toBe("Äpätti");
  });

  it("käyttää valittua aluetta, jos sillä on etsintä käynnissä", () => {
    expect(valitseAlue(alueet, "neittava", etsinnat)?.nimi).toBe("Neittävä");
  });

  it("ei näytä valittua aluetta, jolla ei ole etsintää", () => {
    expect(valitseAlue(alueet, "neittava", etsinnat.slice(1))?.nimi).toBe("Äpätti");
  });

  it("palauttaa null, jos kukaan ei etsi tai alue on poistettu", () => {
    expect(valitseAlue(alueet, "apatti", [])).toBeNull();
    expect(valitseAlue(alueet, null, [{ alueAvain: "poistettu", nimi: null, alkoi: iso(1), sijainti: null }])).toBeNull();
  });
});

describe("etsintaRivit", () => {
  const loydot: Loyto[] = [
    { paikkaId: "apatti-1", nimi: "pekka", aika: iso(5) },
    { paikkaId: "apatti-2", nimi: "Pekka", aika: iso(90) }, // ennen aloitusta
    { paikkaId: "neittava-1", nimi: "Pekka", aika: iso(4) }, // eri alue
  ];

  it("laskee ajat ja aloituksen jälkeiset löydöt alueelta nimimerkillä", () => {
    const [rivi] = etsintaRivit([{ alueAvain: "apatti", nimi: "Pekka ", alkoi: iso(60), sijainti: null }], alueet, loydot, NYT);
    expect(rivi).toEqual({
      alueNimi: "Äpätti",
      alueAvain: "apatti",
      nimi: "Pekka ",
      kulunutMs: 60 * 60_000,
      jaljellaMs: ETSINTA_MAX_MS - 60 * 60_000,
      loydetty: 1,
      yhteensa: 2,
      sijainti: null,
    });
  });

  it("laskee sijainnin iän", () => {
    const [rivi] = etsintaRivit(
      [{ alueAvain: "apatti", nimi: "A", alkoi: iso(60), sijainti: { lat: 60.1, lng: 24.9, aika: iso(2) } }],
      alueet,
      [],
      NYT,
    );
    expect(rivi.sijainti).toEqual({ lat: 60.1, lng: 24.9, ikaMs: 2 * 60_000 });
  });

  it("ei laske löytöjä nimettömälle etsijälle", () => {
    expect(etsintaRivit([{ alueAvain: "apatti", nimi: null, alkoi: iso(60), sijainti: null }], alueet, loydot, NYT)[0].loydetty).toBeNull();
  });

  it("pudottaa takarajan ylittäneet ja järjestää vanhimman ensin", () => {
    const rivit = etsintaRivit(
      [
        { alueAvain: "apatti", nimi: "uusi", alkoi: iso(1), sijainti: null },
        { alueAvain: "apatti", nimi: "vanha", alkoi: iso(100), sijainti: null },
        { alueAvain: "apatti", nimi: "ohi", alkoi: iso(181), sijainti: null },
      ],
      alueet,
      [],
      NYT,
    );
    expect(rivit.map((r) => r.nimi)).toEqual(["vanha", "uusi"]);
  });
});

describe("ryhmitteleAlueittain", () => {
  it("ryhmittelee rivit alueittain ensimmäisen rivin järjestyksessä", () => {
    const rivit = etsintaRivit(
      [
        { alueAvain: "apatti", nimi: "A", alkoi: iso(50), sijainti: null },
        { alueAvain: "neittava", nimi: "B", alkoi: iso(40), sijainti: null },
        { alueAvain: "apatti", nimi: "C", alkoi: iso(30), sijainti: null },
      ],
      alueet,
      [],
      NYT,
    );
    expect(ryhmitteleAlueittain(rivit).map((r) => [r.alueNimi, r.rivit.map((x) => x.nimi)])).toEqual([
      ["Äpätti", ["A", "C"]],
      ["Neittävä", ["B"]],
    ]);
  });
});

describe("katkoRivit", () => {
  it("listaa löytäjät aikajärjestyksessä mitalein", () => {
    const apatti = alueet.find((a) => a.nimi === "Äpätti")!;
    const rivit = katkoRivit(apatti, [
      { paikkaId: "apatti-1", nimi: "Toinen", aika: iso(5) },
      { paikkaId: "apatti-1", nimi: "Eka", aika: iso(10) },
    ]);
    expect(rivit[0].loytajat).toEqual([
      { nimi: "Eka", mitali: "kulta" },
      { nimi: "Toinen", mitali: "hopea" },
    ]);
    expect(rivit[1].loytajat).toEqual([]);
  });
});

describe("muotoileIka", () => {
  it("näyttää sekunnit alle minuutin ja muuten minuutit", () => {
    expect(muotoileIka(12_400)).toBe("12 s sitten");
    expect(muotoileIka(4 * 60_000 + 59_000)).toBe("4 min sitten");
  });
});

describe("muotoileKesto", () => {
  it("muotoilee minuutit ja tunnit", () => {
    expect(muotoileKesto(5 * 60_000 + 9_000)).toBe("5:09");
    expect(muotoileKesto(3_909_000)).toBe("1:05:09");
    expect(muotoileKesto(-1)).toBe("0:00");
  });
});
