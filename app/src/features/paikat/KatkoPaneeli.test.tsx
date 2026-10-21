// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { KatkoPaneeli } from "./KatkoPaneeli";
import type { Paikka, Loyto } from "./types";
import type { Sijainti } from "../../lib/geolocation";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const paikka = {
  id: "neittava-1",
  alue: "Neittävä",
  kuvaus: "Kiven alla",
  lat: 60.17,
  lng: 24.94,
  kuva: "k.webp",
  piilotaLahimmasta: false,
  pullonKokoMl: null,
} as Paikka;

const sijainti: Sijainti = { lat: 60.17, lng: 24.94, tarkkuusMetreina: 10, aikaleima: 0 };

let kontti: HTMLDivElement;
let juuri: Root;

function piirra(osat: { sijainti?: Sijainti | null; omatLoydot?: Loyto[]; onLoyto?: (l: Loyto) => void } = {}) {
  act(() => {
    juuri.render(
      <KatkoPaneeli
        paikka={paikka}
        loydot={[]}
        omatLoydot={osat.omatLoydot ?? []}
        etsintaAlkoi={null}
        loytoajastinAlkoi={null}
        sijainti={osat.sijainti === undefined ? sijainti : osat.sijainti}
        onLoyto={osat.onLoyto ?? (() => {})}
        onSulje={() => {}}
      />,
    );
  });
}

function kirjoitaNimi(nimi: string) {
  const syote = kontti.querySelector("input") as HTMLInputElement;
  const asetin = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    asetin.call(syote, nimi);
    syote.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const lahetaNappi = () => kontti.querySelector("button[type=submit]") as HTMLButtonElement;

beforeEach(() => {
  localStorage.clear();
  kontti = document.createElement("div");
  document.body.appendChild(kontti);
  juuri = createRoot(kontti);
});

afterEach(() => {
  act(() => juuri.unmount());
  kontti.remove();
  vi.unstubAllGlobals();
});

describe("KatkoPaneeli löytöflow", () => {
  it("lähettää nimen ja sijainnin workerille ja kutsuu onLoyto", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const onLoyto = vi.fn();
    piirra({ onLoyto });

    kirjoitaNimi("  Matti  ");
    await act(async () => {
      lahetaNappi().click();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ paikkaId: "neittava-1", nimi: "Matti", lat: 60.17, lng: 24.94 });
    expect(onLoyto).toHaveBeenCalledWith(expect.objectContaining({ paikkaId: "neittava-1", nimi: "Matti" }));
  });

  it("estää lähetyksen ilman nimeä", () => {
    piirra();
    expect(lahetaNappi().disabled).toBe(true);
  });

  it("estää lähetyksen ja varoittaa, kun sijaintia ei ole", () => {
    piirra({ sijainti: null });
    kirjoitaNimi("Matti");
    expect(lahetaNappi().disabled).toBe(true);
    expect(kontti.textContent).toContain("Sijaintia ei saatu");
  });

  it("varoittaa epätarkasta GPS:stä", () => {
    piirra({ sijainti: { ...sijainti, tarkkuusMetreina: 120 } });
    expect(kontti.textContent).toContain("GPS on epätarkka");
  });

  it("estää tuplan clientillä kirjainkoosta riippumatta eikä kutsu fetchiä", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    piirra({ omatLoydot: [{ paikkaId: "neittava-1", nimi: "Matti", aika: new Date().toISOString(), kestoMs: null }] });
    kirjoitaNimi("matti");
    expect(lahetaNappi().disabled).toBe(true);
    expect(kontti.textContent).toContain("Olet jo merkinnyt");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("näyttää workerin virheen eikä kutsu onLoyto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Olet liian kaukana kätköstä" }),
    }));
    const onLoyto = vi.fn();
    piirra({ onLoyto });
    kirjoitaNimi("Matti");
    await act(async () => {
      lahetaNappi().click();
    });
    expect(kontti.textContent).toContain("Olet liian kaukana kätköstä");
    expect(onLoyto).not.toHaveBeenCalled();
  });
});
