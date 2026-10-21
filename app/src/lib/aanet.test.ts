import { describe, it, expect, beforeEach, vi } from "vitest";
import { aanetPaalla, asetaAanet, soitaLoytoAani } from "./aanet";

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("aanet", () => {
  it("on oletuksena pois päältä ja muistaa asetuksen", () => {
    expect(aanetPaalla()).toBe(false);
    asetaAanet(true);
    expect(aanetPaalla()).toBe(true);
    asetaAanet(false);
    expect(aanetPaalla()).toBe(false);
  });

  it("ei luo AudioContextia kun äänet ovat pois", () => {
    const konteksti = vi.fn();
    vi.stubGlobal("AudioContext", konteksti);
    soitaLoytoAani();
    expect(konteksti).not.toHaveBeenCalled();
  });

  it("ei kaadu kun AudioContext puuttuu tai heittää", () => {
    asetaAanet(true);
    vi.stubGlobal("AudioContext", undefined);
    expect(() => soitaLoytoAani()).not.toThrow();
    vi.stubGlobal("AudioContext", function () {
      throw new Error("estetty");
    });
    expect(() => soitaLoytoAani()).not.toThrow();
  });
});
