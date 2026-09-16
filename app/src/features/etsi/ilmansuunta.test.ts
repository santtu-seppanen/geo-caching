import { describe, it, expect } from "vitest";
import { ilmansuuntaTekstiksi } from "./ilmansuunta";

describe("ilmansuuntaTekstiksi", () => {
  it("tunnistaa neljä pääilmansuuntaa", () => {
    expect(ilmansuuntaTekstiksi(0)).toBe("pohjoiseen");
    expect(ilmansuuntaTekstiksi(90)).toBe("itään");
    expect(ilmansuuntaTekstiksi(180)).toBe("etelään");
    expect(ilmansuuntaTekstiksi(270)).toBe("länteen");
  });

  it("tunnistaa väli-ilmansuunnat", () => {
    expect(ilmansuuntaTekstiksi(45)).toBe("koilliseen");
    expect(ilmansuuntaTekstiksi(135)).toBe("kaakkoon");
    expect(ilmansuuntaTekstiksi(225)).toBe("lounaaseen");
    expect(ilmansuuntaTekstiksi(315)).toBe("luoteeseen");
  });

  it("kääntää yli 360 asteen ja negatiiviset arvot oikein", () => {
    expect(ilmansuuntaTekstiksi(360)).toBe("pohjoiseen");
    expect(ilmansuuntaTekstiksi(-90)).toBe("länteen");
  });

  it("pyöristää lähimpään pääilmansuuntaan", () => {
    expect(ilmansuuntaTekstiksi(10)).toBe("pohjoiseen");
    expect(ilmansuuntaTekstiksi(40)).toBe("koilliseen");
  });
});
