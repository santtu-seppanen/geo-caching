// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useEtsinnanPalautus } from "./useEtsinnanPalautus";
import { lataaEtsinnanAlku, tallennaEtsinnanAlku } from "./pelitila";
import { tallennaPelaajanNimi } from "../../lib/pelaajanNimi";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NYT = new Date("2026-10-21T12:00:00Z").getTime();
let juuri: Root;
let kontti: HTMLDivElement;
const onPalautettu = vi.fn();

function Testi({ laukaisin }: { laukaisin: number }) {
  useEtsinnanPalautus(laukaisin, onPalautettu);
  return null;
}
const vastaus = (rivit: unknown[]) => vi.fn().mockResolvedValue({ ok: true, json: async () => rivit });
const rivi = (alkoi: number, nimi: string | null = "Matti") => ({ alueAvain: "neittava", nimi, alkoi: new Date(alkoi).toISOString(), sijainti: null });
const piirra = (laukaisin = 0) => act(async () => juuri.render(<Testi laukaisin={laukaisin} />));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(NYT);
  localStorage.clear();
  onPalautettu.mockClear();
  kontti = document.createElement("div");
  juuri = createRoot(kontti);
});
afterEach(() => {
  act(() => juuri.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useEtsinnanPalautus", () => {
  it("tallentaa palvelimen etsinnän laitteelle ja ilmoittaa palautuksesta", async () => {
    tallennaPelaajanNimi("Matti");
    vi.stubGlobal("fetch", vastaus([rivi(NYT - 600_000)]));
    await piirra();
    expect(lataaEtsinnanAlku("neittava")).toBe(NYT - 600_000);
    expect(onPalautettu).toHaveBeenCalledTimes(1);
  });

  it("ei tee mitään ilman nimimerkkiä eikä hae palvelimelta", async () => {
    const fetchMock = vastaus([rivi(NYT - 600_000)]);
    vi.stubGlobal("fetch", fetchMock);
    await piirra();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lataaEtsinnanAlku("neittava")).toBeNull();
  });

  it("ei korvaa laitteen uudempaa aloitusta eikä kutsu onPalautettu", async () => {
    tallennaPelaajanNimi("Matti");
    tallennaEtsinnanAlku("neittava", NYT - 60_000);
    vi.stubGlobal("fetch", vastaus([rivi(NYT - 600_000)]));
    await piirra();
    expect(lataaEtsinnanAlku("neittava")).toBe(NYT - 60_000);
    expect(onPalautettu).not.toHaveBeenCalled();
  });

  it("yrittää uudelleen kun nimimerkki tallennetaan (laukaisin muuttuu)", async () => {
    vi.stubGlobal("fetch", vastaus([rivi(NYT - 600_000)]));
    await piirra(0);
    expect(lataaEtsinnanAlku("neittava")).toBeNull();
    tallennaPelaajanNimi("matti");
    await piirra(1);
    expect(lataaEtsinnanAlku("neittava")).toBe(NYT - 600_000);
  });

  it("sietää verkkovirheen", async () => {
    tallennaPelaajanNimi("Matti");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await piirra();
    expect(onPalautettu).not.toHaveBeenCalled();
  });
});
