import { describe, it, expect } from "vitest";
import { ryhmitteleAlueiksi, laskeKeskipiste } from "./alueet";
import type { Paikka } from "./types";

describe("laskeKeskipiste", () => {
  it("palauttaa pisteen itsensä kun listassa on yksi paikka", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        alueVihje: "Vihje A",
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
        alueVihje: "Vihje A",
        kuvaus: "Kuvaus",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        alueVihje: "Vihje A",
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
        alueVihje: "Vihje A",
        kuvaus: "Kuvaus",
        lat: 0.0,
        lng: 0.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Kuvaus",
        lat: 3.0,
        lng: 6.0,
        kuva: "kuva2.jpg",
      },
      {
        id: "3",
        alue: "Alue A",
        alueVihje: "Vihje A",
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

describe("ryhmitteleAlueiksi", () => {
  it("palauttaa yhden alueen, jossa yksi paikka", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Kuvaus",
        lat: 60.1699,
        lng: 24.9384,
        kuva: "kuva.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(1);
    expect(alueet[0].alue).toBe("Alue A");
    expect(alueet[0].alueVihje).toBe("Vihje A");
    expect(alueet[0].paikat).toHaveLength(1);
    expect(alueet[0].keskipiste.lat).toBe(60.1699);
    expect(alueet[0].keskipiste.lng).toBe(24.9384);
  });

  it("ryhmittelee useat paikat samaan alueeseen", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Paikka 1",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Paikka 2",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(1);
    expect(alueet[0].alue).toBe("Alue A");
    expect(alueet[0].paikat).toHaveLength(2);
    // Keskipiste pitäisi olla kahden paikan keskiarvo
    expect(alueet[0].keskipiste.lat).toBe(61.0);
    expect(alueet[0].keskipiste.lng).toBe(25.0);
  });

  it("ryhmittelee paikat eri alueisiin", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Paikka A",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue B",
        alueVihje: "Vihje B",
        kuvaus: "Paikka B",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
      {
        id: "3",
        alue: "Alue C",
        alueVihje: "Vihje C",
        kuvaus: "Paikka C",
        lat: 61.0,
        lng: 25.0,
        kuva: "kuva3.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(3);
    expect(alueet[0].alue).toBe("Alue A");
    expect(alueet[1].alue).toBe("Alue B");
    expect(alueet[2].alue).toBe("Alue C");
  });

  it("säilyttää ensimmäisen näkemisen järjestyksen", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue C",
        alueVihje: "Vihje C",
        kuvaus: "Paikka C",
        lat: 61.0,
        lng: 25.0,
        kuva: "kuva3.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        alueVihje: "Vihje A",
        kuvaus: "Paikka A",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "3",
        alue: "Alue B",
        alueVihje: "Vihje B",
        kuvaus: "Paikka B",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet).toHaveLength(3);
    expect(alueet[0].alue).toBe("Alue C");
    expect(alueet[1].alue).toBe("Alue A");
    expect(alueet[2].alue).toBe("Alue B");
  });

  it("käyttää ensimmäisen paikan alueVihje:tä", () => {
    const paikat: Paikka[] = [
      {
        id: "1",
        alue: "Alue A",
        alueVihje: "Ensimmäinen vihje",
        kuvaus: "Paikka 1",
        lat: 60.0,
        lng: 24.0,
        kuva: "kuva1.jpg",
      },
      {
        id: "2",
        alue: "Alue A",
        alueVihje: "Toinen vihje",
        kuvaus: "Paikka 2",
        lat: 62.0,
        lng: 26.0,
        kuva: "kuva2.jpg",
      },
    ];

    const alueet = ryhmitteleAlueiksi(paikat);

    expect(alueet[0].alueVihje).toBe("Ensimmäinen vihje");
  });
});
