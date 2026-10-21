import { describe, it, expect } from "vitest";
import { etsinnanIlmoitus, VAROITUS_ENNEN_PAATTYMISTA_MS } from "./etsinnanIlmoitus";
import { ETSINTA_MAX_MS } from "./etsinta";

const ALKU = 5_000_000;
const LOPPU = ALKU + ETSINTA_MAX_MS;
const VAROITUS = LOPPU - VAROITUS_ENNEN_PAATTYMISTA_MS;

describe("etsinnanIlmoitus", () => {
  it("ei ilmoitusta ennen varoitusrajaa", () => {
    expect(etsinnanIlmoitus(ALKU, ALKU, ALKU + 1000)).toBeNull();
    expect(etsinnanIlmoitus(ALKU, VAROITUS - 2000, VAROITUS - 1)).toBeNull();
  });

  it("varoitus kun varoitusraja ylitetään (täsmälleen rajalla mukaan lukien)", () => {
    expect(etsinnanIlmoitus(ALKU, VAROITUS - 1000, VAROITUS)).toBe("varoitus");
    expect(etsinnanIlmoitus(ALKU, VAROITUS - 1000, VAROITUS + 500)).toBe("varoitus");
  });

  it("varoitus ei toistu rajan jälkeen", () => {
    expect(etsinnanIlmoitus(ALKU, VAROITUS, VAROITUS + 30_000)).toBeNull();
    expect(etsinnanIlmoitus(ALKU, LOPPU - 60_000, LOPPU - 30_000)).toBeNull();
  });

  it("päättyi kun takaraja ylitetään, kerran", () => {
    expect(etsinnanIlmoitus(ALKU, LOPPU - 1000, LOPPU)).toBe("paattyi");
    expect(etsinnanIlmoitus(ALKU, LOPPU, LOPPU + 30_000)).toBeNull();
  });

  it("molemmat rajat kerralla (sovellus taustalla) antaa vain päättymisen", () => {
    expect(etsinnanIlmoitus(ALKU, VAROITUS - 60_000, LOPPU + 60_000)).toBe("paattyi");
  });

  it("uusi aloitus nollaa: vanha edellinenNyt ei laukaise uuden etsinnän rajoja", () => {
    const uusiAlku = LOPPU + 1000;
    expect(etsinnanIlmoitus(uusiAlku, LOPPU + 2000, LOPPU + 32_000)).toBeNull();
  });
});
