// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PelimoodiPaneeli } from "./PelimoodiPaneeli";
import type { Paikka } from "../paikat/types";
import type { Eteneminen } from "./etsinta";
import type { Pelimoodi } from "./pelimoodit";
import { ETSINTA_MAX_MS } from "./etsinta";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const paikka = (id: string) => ({ id, alue: "Neittävä", kuvaus: "", lat: 0, lng: 0, kuva: "" }) as Paikka;
const PAIKAT = [paikka("n-1"), paikka("n-2")];
const ALKU = 1_000_000;

let kontti: HTMLDivElement;
let juuri: Root;

interface Osat {
  moodi: Pelimoodi;
  eteneminen: Partial<Eteneminen>;
  etsintaAlkoi: number | null;
  nyt: number;
  kaynnissa: boolean;
  kaikkiLoydetty: boolean;
  mittaukset: { lat: number; lng: number; etaisyysMetreina: number; aika: number }[];
  sijaintiTiedossa: boolean;
  onAloita: () => void;
  onMittaa: () => void;
}

function piirra(o: Partial<Osat> = {}) {
  const etsintaAlkoi = o.etsintaAlkoi === undefined ? ALKU : o.etsintaAlkoi;
  act(() => {
    juuri.render(
      <PelimoodiPaneeli
        moodi={o.moodi ?? "vapaa"}
        paikat={PAIKAT}
        eteneminen={{ kohde: PAIKAT[0], vuoroAlkoi: etsintaAlkoi, ohitetutIdt: new Set(), ...o.eteneminen }}
        etsintaAlkoi={etsintaAlkoi}
        kaynnissa={o.kaynnissa ?? etsintaAlkoi !== null}
        loytoajastinAlkoi={etsintaAlkoi}
        kaikkiLoydetty={o.kaikkiLoydetty ?? false}
        tila={{ mittaukset: o.mittaukset ?? [] }}
        nyt={o.nyt ?? ALKU}
        sijaintiTiedossa={o.sijaintiTiedossa ?? true}
        onMittaa={o.onMittaa ?? (() => {})}
        onAloita={o.onAloita ?? (() => {})}
      />,
    );
  });
}

const teksti = () => kontti.textContent ?? "";
const nappi = (nimi: RegExp) =>
  [...kontti.querySelectorAll("button")].find((b) => nimi.test(b.textContent ?? "")) as HTMLButtonElement | undefined;

beforeEach(() => {
  kontti = document.createElement("div");
  document.body.appendChild(kontti);
  juuri = createRoot(kontti);
});
afterEach(() => {
  act(() => juuri.unmount());
  kontti.remove();
  vi.restoreAllMocks();
});

describe("PelimoodiPaneeli", () => {
  it("näyttää Aloita etsintä -napin ennen aloitusta ja kutsuu onAloita", () => {
    const onAloita = vi.fn();
    piirra({ etsintaAlkoi: null, kaynnissa: false, onAloita });
    act(() => nappi(/^Aloita etsintä$/)!.click());
    expect(onAloita).toHaveBeenCalledTimes(1);
  });

  it("alusta aloitus vaatii vahvistuksen, ja Peru ei aloita", () => {
    const onAloita = vi.fn();
    piirra({ onAloita });
    act(() => nappi(/Aloita etsintä alusta/)!.click());
    expect(teksti()).toContain("Aloitetaanko alusta?");
    expect(onAloita).not.toHaveBeenCalled();
    act(() => nappi(/^Peru$/)!.click());
    expect(teksti()).not.toContain("Aloitetaanko alusta?");
    act(() => nappi(/Aloita etsintä alusta/)!.click());
    act(() => nappi(/^Aloita alusta$/)!.click());
    expect(onAloita).toHaveBeenCalledTimes(1);
  });

  it("kertoo kun etsintä päättyi 3 h takarajaan", () => {
    piirra({ nyt: ALKU + ETSINTA_MAX_MS + 1, kaynnissa: false });
    expect(teksti()).toContain("Etsintä päättyi");
    expect(nappi(/Aloita uusi etsintä/)).toBeTruthy();
  });

  it("kertoo kun kaikki kätköt on löydetty", () => {
    piirra({ kaikkiLoydetty: true });
    expect(teksti()).toContain("Olet löytänyt kaikki alueen kätköt!");
  });

  it("vihjeet: näyttää avautuneiden vihjeiden määrän ja ajan seuraavaan", () => {
    piirra({ moodi: "vihjeet", nyt: ALKU + 6 * 60_000 });
    expect(teksti()).toContain("Vihjeitä 2 / 3");
    expect(teksti()).toContain("Seuraava vihje 4:00 päästä");
  });

  it("vihjeet: ensimmäinen vihje avautuu heti aloituksesta, ennen aloitusta odotetaan", () => {
    piirra({ moodi: "vihjeet", etsintaAlkoi: null, kaynnissa: false, eteneminen: { vuoroAlkoi: null } });
    expect(teksti()).toContain("Vihjeet alkavat avautua");
  });

  it("ajastettu: näyttää jäljellä olevan ajan ja ohitetut", () => {
    piirra({ moodi: "ajastettu", nyt: ALKU + 60_000, eteneminen: { ohitetutIdt: new Set(["n-0"]) } });
    expect(teksti()).toContain("Aikaa jäljellä 4:00");
    expect(teksti()).toContain("Ohitettu 1.");
  });

  it("ajastettu: kun kaikki kätköt on ohitettu, kehotetaan aloittamaan alusta", () => {
    piirra({ moodi: "ajastettu", eteneminen: { kohde: null, ohitetutIdt: new Set(["n-1", "n-2"]) } });
    expect(teksti()).toContain("Haku päättyi — aika loppui 2 kätkön kohdalla");
  });

  it("kolmiomittaus: mittausnappi on pois käytöstä ilman sijaintia ja 60 s odotuksen aikana", () => {
    piirra({ moodi: "kolmiomittaus", sijaintiTiedossa: false });
    expect(nappi(/Odotetaan sijaintia/)!.disabled).toBe(true);

    piirra({
      moodi: "kolmiomittaus",
      nyt: ALKU + 20_000,
      mittaukset: [{ lat: 0, lng: 0, etaisyysMetreina: 230, aika: ALKU }],
    });
    expect(nappi(/Seuraava mittaus 0:40 päästä/)!.disabled).toBe(true);
    expect(teksti()).toContain("noin 230 m");
  });

  it("kolmiomittaus: nappi toimii kun sijainti on tiedossa ja odotus on ohi", () => {
    const onMittaa = vi.fn();
    piirra({ moodi: "kolmiomittaus", onMittaa });
    act(() => nappi(/Mittaa etäisyys tästä/)!.click());
    expect(onMittaa).toHaveBeenCalledTimes(1);
  });
});
