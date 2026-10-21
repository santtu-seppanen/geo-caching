import { describe, it, expect, beforeEach } from "vitest";
import { haeJono, lahetaJono, lisaaJonoon, poistaJonosta, type JonotettuLoyto } from "./loytoJono";

const loyto = (nimi: string, paikkaId = "a-1"): JonotettuLoyto => ({
  paikkaId,
  nimi,
  aika: "2026-10-21T10:00:00.000Z",
  kestoMs: null,
  etsintaKestoMs: null,
  lat: 60,
  lng: 24,
  kommentti: null,
});

const onVerkko = (e: unknown) => e instanceof TypeError;

beforeEach(() => localStorage.clear());

describe("löytöjono", () => {
  it("tallentaa ja poistaa, tupla (kirjainkoosta riippumatta) ei lisäänny", () => {
    lisaaJonoon(loyto("Matti"));
    lisaaJonoon(loyto("MATTI"));
    expect(haeJono()).toHaveLength(1);
    poistaJonosta(loyto("matti"));
    expect(haeJono()).toHaveLength(0);
  });

  it("palauttaa tyhjän rikkinäisestä datasta", () => {
    localStorage.setItem("viinakatkoily.loytojono", "{ei json");
    expect(haeJono()).toEqual([]);
  });

  it("lähettää kaikki ja tyhjentää jonon", async () => {
    lisaaJonoon(loyto("A"));
    lisaaJonoon(loyto("B"));
    const lahetetyt: string[] = [];
    const n = await lahetaJono(async (l) => void lahetetyt.push(l.nimi), onVerkko);
    expect(n).toBe(2);
    expect(lahetetyt).toEqual(["A", "B"]);
    expect(haeJono()).toHaveLength(0);
  });

  it("pysähtyy verkkovirheeseen ja säilyttää loput jonossa", async () => {
    lisaaJonoon(loyto("A"));
    lisaaJonoon(loyto("B"));
    lisaaJonoon(loyto("C"));
    const n = await lahetaJono(async (l) => {
      if (l.nimi === "B") throw new TypeError("offline");
    }, onVerkko);
    expect(n).toBe(1);
    expect(haeJono().map((l) => l.nimi)).toEqual(["B", "C"]);
  });

  it("pudottaa pysyvästi hylätyn löydön ja jatkaa", async () => {
    lisaaJonoon(loyto("A"));
    lisaaJonoon(loyto("B"));
    const n = await lahetaJono(async (l) => {
      if (l.nimi === "A") throw new Error("409");
    }, onVerkko);
    expect(n).toBe(1);
    expect(haeJono()).toHaveLength(0);
  });
});
