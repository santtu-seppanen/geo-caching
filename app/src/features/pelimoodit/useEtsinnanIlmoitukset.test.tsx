// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useEtsinnanIlmoitukset } from "./useEtsinnanIlmoitukset";
import { tallennaEtsinnanAlku } from "./pelitila";
import { ETSINTA_MAX_MS } from "./etsinta";
import { VAROITUS_ENNEN_PAATTYMISTA_MS } from "./etsinnanIlmoitus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ALKU = new Date("2026-10-21T10:00:00Z").getTime();
let juuri: Root;
let kontti: HTMLDivElement;
const ilmoitukset: [string, string][] = [];
const onIlmoitus = (alue: string, i: string) => void ilmoitukset.push([alue, i]);

function Testi() {
  useEtsinnanIlmoitukset(onIlmoitus);
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(ALKU);
  localStorage.clear();
  ilmoitukset.length = 0;
  kontti = document.createElement("div");
  juuri = createRoot(kontti);
  tallennaEtsinnanAlku("neittava", ALKU);
  act(() => juuri.render(<Testi />));
});
afterEach(() => {
  act(() => juuri.unmount());
  vi.useRealTimers();
});

describe("useEtsinnanIlmoitukset", () => {
  it("ilmoittaa varoituksen ja päättymisen kerran kummankin", () => {
    act(() => void vi.advanceTimersByTime(ETSINTA_MAX_MS - VAROITUS_ENNEN_PAATTYMISTA_MS - 20_000));
    expect(ilmoitukset).toEqual([]);

    act(() => void vi.advanceTimersByTime(30_000));
    expect(ilmoitukset).toEqual([["neittava", "varoitus"]]);

    act(() => void vi.advanceTimersByTime(VAROITUS_ENNEN_PAATTYMISTA_MS));
    expect(ilmoitukset).toEqual([["neittava", "varoitus"], ["neittava", "paattyi"]]);

    act(() => void vi.advanceTimersByTime(10 * 60_000));
    expect(ilmoitukset).toHaveLength(2);
  });

  it("ei ilmoita alueelta, jolla etsintää ei ole aloitettu", () => {
    localStorage.clear();
    act(() => void vi.advanceTimersByTime(ETSINTA_MAX_MS + 60_000));
    expect(ilmoitukset).toEqual([]);
  });
});
