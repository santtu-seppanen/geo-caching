import { describe, it, expect } from "vitest";
import { uudetLoydot, muodostaLoytoIlmoitus } from "./loytoVertailu";
import type { Loyto, Paikka } from "./types";

describe("uudetLoydot", () => {
  it("palauttaa tyhjän listan kun mikään ei ole muuttunut", () => {
    const loydot: Loyto[] = [{ paikkaId: "alue-a-1", nimi: "Matti", aika: "2026-09-15T10:00:00Z" }];

    expect(uudetLoydot(loydot, loydot)).toEqual([]);
  });

  it("löytää uuden löydön joka ilmestyi vanhan listan jälkeen", () => {
    const vanhat: Loyto[] = [{ paikkaId: "alue-a-1", nimi: "Matti", aika: "2026-09-15T10:00:00Z" }];
    const uudet: Loyto[] = [
      ...vanhat,
      { paikkaId: "alue-a-2", nimi: "Liisa", aika: "2026-09-15T10:05:00Z" },
    ];

    const tulos = uudetLoydot(vanhat, uudet);

    expect(tulos).toHaveLength(1);
    expect(tulos[0].nimi).toBe("Liisa");
  });

  it("ei pidä eri löytäjää samasta paikasta duplikaattina", () => {
    const vanhat: Loyto[] = [{ paikkaId: "alue-a-1", nimi: "Matti", aika: "2026-09-15T10:00:00Z" }];
    const uudet: Loyto[] = [
      ...vanhat,
      { paikkaId: "alue-a-1", nimi: "Liisa", aika: "2026-09-15T10:05:00Z" },
    ];

    const tulos = uudetLoydot(vanhat, uudet);

    expect(tulos).toHaveLength(1);
    expect(tulos[0].nimi).toBe("Liisa");
  });
});

describe("muodostaLoytoIlmoitus", () => {
  it("sisältää löytäjän nimen ja alueen kun paikka tunnetaan", () => {
    const loyto: Loyto = { paikkaId: "neittava-1", nimi: "Matti", aika: "2026-09-15T10:00:00Z" };
    const paikka: Paikka = {
      id: "neittava-1",
      alue: "Neittävä",
      kuvaus: "Kuusen alla",
      lat: 64.0,
      lng: 27.0,
      kuva: "kuva.jpg",
    };

    const ilmoitus = muodostaLoytoIlmoitus(loyto, paikka);

    expect(ilmoitus.viesti).toContain("Matti");
    expect(ilmoitus.viesti).toContain("Neittava");
  });

  it("toimii myös ilman tunnettua paikkaa", () => {
    const loyto: Loyto = { paikkaId: "tuntematon-1", nimi: "Matti", aika: "2026-09-15T10:00:00Z" };

    const ilmoitus = muodostaLoytoIlmoitus(loyto, undefined);

    expect(ilmoitus.viesti).toContain("Matti");
  });
});
