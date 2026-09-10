import { describe, it, expect } from "vitest";
import { validoiLoytoPyynto } from "./validointi";

describe("validoiLoytoPyynto", () => {
  const tunnetutPaikkaIdt = new Set(["paikka-1", "paikka-2", "paikka-3"]);

  it("hyväksyy validi pyynnön", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.paikkaId).toBe("paikka-1");
      expect(tulos.pyynto.nimi).toBe("Löytäjä");
    }
  });

  it("trimmaa whitespace:sta nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "  Löytäjä  " },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.nimi).toBe("Löytäjä");
    }
  });

  it("hylkää tuntemattoman paikkaId:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "tuntematon-paikka", nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää tyhjän nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää whitespace-ainoastaan nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "   " },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää liian pitkän nimi:n", () => {
    const liianPitkaNimi = "a".repeat(51);
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: liianPitkaNimi },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi saa olla enintään 50 merkkiä");
    }
  });

  it("hyväksyy täsmälleen max-pituuden nimi:n", () => {
    const maxPituusNimi = "a".repeat(50);
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: maxPituusNimi },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.nimi).toBe(maxPituusNimi);
    }
  });

  it("hylkää null:in", () => {
    const tulos = validoiLoytoPyynto(null, tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää listan", () => {
    const tulos = validoiLoytoPyynto(
      ["paikka-1", "Löytäjä"],
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää merkkijonon", () => {
    const tulos = validoiLoytoPyynto("paikka-1", tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää numeron", () => {
    const tulos = validoiLoytoPyynto(123, tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää objektin ilman paikkaId:tä", () => {
    const tulos = validoiLoytoPyynto(
      { nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää objektin ilman nimi:ä", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää objektin, jossa paikkaId on ei-merkkijono", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: 123, nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää objektin, jossa nimi on ei-merkkijono", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: 123 },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });
});
