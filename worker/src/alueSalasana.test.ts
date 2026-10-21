import { describe, it, expect } from "vitest";
import { alueTunnisteeksi, hashaaSalasana, normalisoiAlueNimi, paikanTunniste, tarkistaSalasana } from "./alueSalasana";

describe("alueen salasana", () => {
  it("hyväksyy oikean ja hylkää väärän salasanan", async () => {
    const hash = await hashaaSalasana("salainen1");
    expect(hash).toMatch(/^pbkdf2\$\d+\$/);
    expect(hash).not.toContain("salainen1");
    expect(await tarkistaSalasana("salainen1", hash)).toBe(true);
    expect(await tarkistaSalasana("salainen2", hash)).toBe(false);
  });

  it("käyttää eri suolaa joka kerta", async () => {
    expect(await hashaaSalasana("sama-salasana")).not.toBe(await hashaaSalasana("sama-salasana"));
  });

  it("hylkää rikkinäisen tallennetun arvon", async () => {
    expect(await tarkistaSalasana("x", "")).toBe(false);
    expect(await tarkistaSalasana("x", "md5$1$abc$def")).toBe(false);
  });
});

describe("aluenimien normalisointi", () => {
  it("vastaa frontendin normalisointia ja tunnistetta", () => {
    expect(normalisoiAlueNimi(" Äpätti ")).toBe("apatti");
    expect(alueTunnisteeksi("Iso Kivi!")).toBe("iso-kivi");
    expect(paikanTunniste("iso-kivi-3")).toBe("iso-kivi");
    expect(paikanTunniste("yksittainen")).toBe("yksittainen");
  });
});
