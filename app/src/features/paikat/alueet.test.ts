import { describe, it, expect } from "vitest";
import {
  ryhmitteleAlueiksi,
  laskeKeskipiste,
  paikanTunniste,
  alueenLoydettyjenMaara,
  alueLoydettyKokonaan,
} from "./alueet";
import type { Paikka } from "./types";

describe("laskeKeskipiste", () => {
  it("palauttaa pisteen itsensä kun listassa on yksi paikka", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 60.1699,
        lng: 24.9384,
        kuva: "kuva.jpg",
      },
    ];

    const keskipiste = laskeKeskipiste(paikat);

    expect(keskipiste.lat).toBe(60.1699);
    expect(keskipiste.lng).toBe(24.9384);
  });

  it("laskee oikean keskipisteen kahdelle paikalle", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const keskipiste = laskeKeskipiste(paikat);

    expect(keskipiste.lat).toBe(61.0);
    expect(keskipiste.lng).toBe(25.0);
  });

  it("laskee oikean keskipisteen useammalle paikalle", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 0.0,
        lng: 0.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 3.0,
        lng: 6.0,
        kuva: "kuva2.jpg",
      },
      {
        id: "3",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 3.0,
        lng: 0.0,
        kuva: "kuva3.jpg",
      },
    ];

    const keskipiste = laskeKeskipiste(paikat);

    expect(keskipiste.lat).toBe(2.0);
    expect(keskipiste.lng).toBe(2.0);
  });
});

describe("paikanTunniste", () => {
  it("poistaa numero-osan kaksiosaisesta id:stä", () => {
    expect(paikanTunniste("neittava-1")).toBe("neittava");
    expect(paikanTunniste("neittava-2")).toBe("neittava");
  });

  it("palauttaa koko id:n jos siinä ei ole numero-osaa", () => {
    expect(paikanTunniste("tyrnava")).toBe("tyrnava");
  });

  it("säilyttää alueen nimessä olevat väliviivat", () => {
    expect(paikanTunniste("neittava-jarvi-3")).toBe("neittava-jarvi");
  });
});

describe("ryhmitteleAlueiksi", () => {
  it("palauttaa yhden alueen, jossa yksi paikka", () => {
    const paikat: Paikka[] = [
      {
        id: "alue-a-1",
        alue: "Alue A",
        kuvaus: "Kuvaus",
        lat: 60.1699,
        lng: 24.9384,
        kuva: "kuva.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(1);
    expect(alueet[0].alue).toBe("alue-a");
    expect(alueet[0].nimi).toBe("Alue A");
    expect(alueet[0].paikat).toHaveLength(1);
    expect(alueet[0].keskipiste.lat).toBe(60.1699);
    expect(alueet[0].keskipiste.lng).toBe(24.9384);
  });

  it("säilyttää alueen nimen ääkköset ja ison alkukirjaimen, vaikka id-tunniste on ascii-normalisoitu", () => {
    const paikat: Paikka[] = [
      {
        id: "apatti-1",
        alue: "Äpätti",
        kuvaus: "Kuvaus",
        lat: 60.1699,
        lng: 24.9384,
        kuva: "kuva.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet[0].alue).toBe("apatti");
    expect(alueet[0].nimi).toBe("Äpätti");
  });

  it("ryhmittelee useat paikat samaan alueeseen id:n tekstiosan perusteella", () => {
    const paikat: Paikka[] = [
      {
        id: "alue-a-1",
        alue: "Alue A",
        kuvaus: "Paikka 1",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "alue-a-2",
        alue: "Alue A",
        kuvaus: "Paikka 2",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(1);
    expect(alueet[0].alue).toBe("alue-a");
    expect(alueet[0].paikat).toHaveLength(2);
    // Keskipiste pitäisi olla kahden paikan keskiarvo
    expect(alueet[0].keskipiste.lat).toBe(61.0);
    expect(alueet[0].keskipiste.lng).toBe(25.0);
  });

  it("ryhmittelee paikat eri alueisiin", () => {
    const paikat: Paikka[] = [
      {
        id: "alue-a-1",
        alue: "Alue A",
        kuvaus: "Paikka A",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "alue-b-1",
        alue: "Alue B",
        kuvaus: "Paikka B",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
      {
        id: "alue-c-1",
        alue: "Alue C",
        kuvaus: "Paikka C",
        lat: 61.0,
        lng: 25.0,
        kuva: "kuva3.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(3);
    expect(alueet[0].alue).toBe("alue-a");
    expect(alueet[1].alue).toBe("alue-b");
    expect(alueet[2].alue).toBe("alue-c");
  });

  it("säilyttää ensimmäisen näkemisen järjestyksen", () => {
    const paikat: Paikka[] = [
      {
        id: "alue-c-1",
        alue: "Alue C",
        kuvaus: "Paikka C",
        lat: 61.0,
        lng: 25.0,
        kuva: "kuva3.jpg",
      },
      {
        id: "alue-a-1",
        alue: "Alue A",
        kuvaus: "Paikka A",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "alue-b-1",
        alue: "Alue B",
        kuvaus: "Paikka B",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(3);
    expect(alueet[0].alue).toBe("alue-c");
    expect(alueet[1].alue).toBe("alue-a");
    expect(alueet[2].alue).toBe("alue-b");
  });
});

describe("alueenLoydettyjenMaara ja alueLoydettyKokonaan", () => {
  const alue = {
    alue: "alue-a",
    nimi: "Alue A",
    keskipiste: { lat: 60.0, lng: 24.0 },
    paikat: [
      { id: "alue-a-1", alue: "Alue A", kuvaus: "Paikka 1", lat: 60.0, lng: 24.0, kuva: "kuva1.jpg" },
      { id: "alue-a-2", alue: "Alue A", kuvaus: "Paikka 2", lat: 60.1, lng: 24.1, kuva: "kuva2.jpg" },
    ],
  };

  it("laskee nollan löydön kun mitään ei ole löydetty", () => {
    expect(alueenLoydettyjenMaara(alue, new Set())).toBe(0);
    expect(alueLoydettyKokonaan(alue, new Set())).toBe(false);
  });

  it("laskee osittaisen löytymisen oikein", () => {
    const loydetytIdt = new Set(["alue-a-1"]);

    expect(alueenLoydettyjenMaara(alue, loydetytIdt)).toBe(1);
    expect(alueLoydettyKokonaan(alue, loydetytIdt)).toBe(false);
  });

  it("tunnistaa alueen kokonaan löydetyksi kun kaikki kätköt on löydetty", () => {
    const loydetytIdt = new Set(["alue-a-1", "alue-a-2"]);

    expect(alueenLoydettyjenMaara(alue, loydetytIdt)).toBe(2);
    expect(alueLoydettyKokonaan(alue, loydetytIdt)).toBe(true);
  });
});
