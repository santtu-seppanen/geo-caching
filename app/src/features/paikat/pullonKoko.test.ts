import { describe, it, expect } from "vitest";
import { PULLON_KOOT, pullonKokoNimi } from "./pullonKoko";

describe("pullonKokoNimi", () => {
  it("palauttaa tunnetun koon nimen", () => {
    expect(pullonKokoNimi(700)).toBe("700 ml -pullo");
    expect(pullonKokoNimi(1000)).toBe("Litran pullo");
  });

  it("palauttaa millilitramäärän jos kokoa ei tunneta", () => {
    expect(pullonKokoNimi(123)).toBe("123 ml");
  });

  it("ei sisällä yli litran kokoja", () => {
    expect(PULLON_KOOT.every((koko) => koko.ml <= 1000)).toBe(true);
  });
});
