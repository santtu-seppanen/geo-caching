import { describe, it, expect } from "vitest";
import {
  yhdistaLoydot,
  laskePistetaulu,
  laskeOmatLoydot,
  mitalitYhdelleKatkolle,
  laskeMitaliMaaratNimittain,
} from "./tilastoLaskenta";
import type { Loyto, Paikka } from "../paikat/types";

function loyto(osittaiset: Partial<Loyto>): Loyto {
  return { paikkaId: "neittava-1", nimi: "Matti", aika: "2026-01-01T10:00:00.000Z", ...osittaiset };
}

function paikka(osittaiset: Partial<Paikka>): Paikka {
  return {
    id: "neittava-1",
    alue: "Neittävä",
    kuvaus: "Kuvaus",
    lat: 60.1699,
    lng: 24.9384,
    kuva: "kuva.jpg",
    ...osittaiset,
  };
}

describe("yhdistaLoydot", () => {
  it("palauttaa palvelimen löydöt sellaisenaan kun ei ole omia", () => {
    const palvelimelta = [loyto({})];

    expect(yhdistaLoydot(palvelimelta, [])).toEqual(palvelimelta);
  });

  it("lisää oman löydön joka ei vielä ole palvelimen listalla", () => {
    const palvelimelta = [loyto({ paikkaId: "neittava-1", nimi: "Matti" })];
    const omat = [loyto({ paikkaId: "neittava-2", nimi: "Matti", aika: "2026-01-02T10:00:00.000Z" })];

    const tulos = yhdistaLoydot(palvelimelta, omat);

    expect(tulos).toHaveLength(2);
  });

  it("ei tuplaa löytöä joka on jo palvelimen listalla eri aikaleimalla (optimistinen lisäys)", () => {
    const palvelimelta = [
      loyto({ paikkaId: "neittava-1", nimi: "Matti", aika: "2026-01-01T10:00:05.000Z" }),
    ];
    // Sama löytö optimistisesti lisättynä clientillä — worker generoi oman aika-kentän,
    // joten se ei koskaan täsmää tarkalleen palvelimen versioon.
    const omat = [
      loyto({ paikkaId: "neittava-1", nimi: "Matti", aika: "2026-01-01T10:00:00.000Z" }),
    ];

    const tulos = yhdistaLoydot(palvelimelta, omat);

    expect(tulos).toHaveLength(1);
    expect(tulos[0].aika).toBe("2026-01-01T10:00:05.000Z");
  });
});

describe("laskePistetaulu", () => {
  it("palauttaa tyhjän listan kun löytöjä ei ole", () => {
    expect(laskePistetaulu([])).toEqual([]);
  });

  it("laskee löytöjen määrän nimimerkkiä kohden", () => {
    const loydot = [
      loyto({ paikkaId: "a-1", nimi: "Matti" }),
      loyto({ paikkaId: "a-2", nimi: "Matti" }),
      loyto({ paikkaId: "a-1", nimi: "Liisa" }),
    ];

    const tulos = laskePistetaulu(loydot);

    expect(tulos).toEqual([
      { nimi: "Matti", maara: 2 },
      { nimi: "Liisa", maara: 1 },
    ]);
  });

  it("järjestää tasatilanteessa nimen mukaan aakkosjärjestykseen", () => {
    const loydot = [loyto({ nimi: "Öystein" }), loyto({ nimi: "Antti" })];

    const tulos = laskePistetaulu(loydot);

    expect(tulos.map((rivi) => rivi.nimi)).toEqual(["Antti", "Öystein"]);
  });
});

describe("mitalitYhdelleKatkolle", () => {
  it("antaa kulta/hopea/pronssi-mitalit löytöjärjestyksessä", () => {
    const katkonLoydot = [
      loyto({ nimi: "Kolmas", aika: "2026-01-03T10:00:00.000Z" }),
      loyto({ nimi: "Ensimmäinen", aika: "2026-01-01T10:00:00.000Z" }),
      loyto({ nimi: "Toinen", aika: "2026-01-02T10:00:00.000Z" }),
    ];

    const tulos = mitalitYhdelleKatkolle(katkonLoydot);

    expect(tulos.get("Ensimmäinen")).toBe("kulta");
    expect(tulos.get("Toinen")).toBe("hopea");
    expect(tulos.get("Kolmas")).toBe("pronssi");
  });

  it("ei anna mitalia neljännelle tai myöhemmälle löytäjälle", () => {
    const katkonLoydot = [
      loyto({ nimi: "A", aika: "2026-01-01T10:00:00.000Z" }),
      loyto({ nimi: "B", aika: "2026-01-02T10:00:00.000Z" }),
      loyto({ nimi: "C", aika: "2026-01-03T10:00:00.000Z" }),
      loyto({ nimi: "D", aika: "2026-01-04T10:00:00.000Z" }),
    ];

    const tulos = mitalitYhdelleKatkolle(katkonLoydot);

    expect(tulos.has("D")).toBe(false);
    expect(tulos.size).toBe(3);
  });
});

describe("laskeMitaliMaaratNimittain", () => {
  it("laskee mitalit yli kaikkien kätköjen", () => {
    const loydot = [
      // Kätkö 1: Matti kulta, Liisa hopea
      loyto({ paikkaId: "a-1", nimi: "Matti", aika: "2026-01-01T10:00:00.000Z" }),
      loyto({ paikkaId: "a-1", nimi: "Liisa", aika: "2026-01-01T11:00:00.000Z" }),
      // Kätkö 2: Liisa kulta, Matti hopea
      loyto({ paikkaId: "a-2", nimi: "Liisa", aika: "2026-01-02T10:00:00.000Z" }),
      loyto({ paikkaId: "a-2", nimi: "Matti", aika: "2026-01-02T11:00:00.000Z" }),
    ];

    const tulos = laskeMitaliMaaratNimittain(loydot);

    expect(tulos.get("Matti")).toEqual({ kulta: 1, hopea: 1, pronssi: 0 });
    expect(tulos.get("Liisa")).toEqual({ kulta: 1, hopea: 1, pronssi: 0 });
  });

  it("palauttaa tyhjän kartan kun löytöjä ei ole", () => {
    expect(laskeMitaliMaaratNimittain([])).toEqual(new Map());
  });
});

describe("laskeOmatLoydot", () => {
  it("palauttaa tyhjän listan kun nimi on tyhjä", () => {
    expect(laskeOmatLoydot([loyto({})], [paikka({})], "")).toEqual([]);
    expect(laskeOmatLoydot([loyto({})], [paikka({})], "   ")).toEqual([]);
  });

  it("suodattaa vain annetun nimimerkin löydöt ja yhdistää paikkatiedon", () => {
    const loydot = [
      loyto({ paikkaId: "neittava-1", nimi: "Matti", aika: "2026-01-01T10:00:00.000Z" }),
      loyto({ paikkaId: "neittava-1", nimi: "Liisa", aika: "2026-01-01T11:00:00.000Z" }),
    ];
    const paikat = [paikka({ id: "neittava-1", alue: "Äpätti", kuvaus: "Puun juurella" })];

    const tulos = laskeOmatLoydot(loydot, paikat, "Matti");

    expect(tulos).toEqual([
      {
        paikkaId: "neittava-1",
        alue: "Äpätti",
        kuvaus: "Puun juurella",
        aika: "2026-01-01T10:00:00.000Z",
      },
    ]);
  });

  it("järjestää tuoreimmat ensin", () => {
    const loydot = [
      loyto({ paikkaId: "a-1", nimi: "Matti", aika: "2026-01-01T10:00:00.000Z" }),
      loyto({ paikkaId: "a-2", nimi: "Matti", aika: "2026-01-03T10:00:00.000Z" }),
      loyto({ paikkaId: "a-3", nimi: "Matti", aika: "2026-01-02T10:00:00.000Z" }),
    ];
    const paikat = [paikka({ id: "a-1" }), paikka({ id: "a-2" }), paikka({ id: "a-3" })];

    const tulos = laskeOmatLoydot(loydot, paikat, "Matti");

    expect(tulos.map((rivi) => rivi.paikkaId)).toEqual(["a-2", "a-3", "a-1"]);
  });

  it("käyttää varatekstiä jos paikkaa ei enää löydy", () => {
    const loydot = [loyto({ paikkaId: "poistettu-1", nimi: "Matti" })];

    const tulos = laskeOmatLoydot(loydot, [], "Matti");

    expect(tulos[0].alue).toBe("Tuntematon alue");
    expect(tulos[0].kuvaus).toBe("Tuntematon kätkö");
  });
});
