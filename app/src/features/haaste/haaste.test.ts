import { describe, it, expect } from "vitest";
import { haasteenEteneminen, type Haaste } from "./haaste";
import type { Loyto } from "../paikat/types";

const haaste: Haaste = {
  nimi: "Viikonloppu",
  alku: "2026-10-23T16:00:00.000Z",
  loppu: "2026-10-25T18:00:00.000Z",
  tavoite: 2,
};
const loyto = (paikkaId: string, aika: string, nimi = "Matti"): Loyto => ({ paikkaId, nimi, aika });
const T = (s: string) => Date.parse(s);

describe("haasteenEteneminen", () => {
  it("laskee vain haasteen aikaiset löydöt ja kätkön kerran", () => {
    const loydot = [
      loyto("a-1", "2026-10-22T10:00:00.000Z"), // ennen
      loyto("a-1", "2026-10-24T10:00:00.000Z"),
      loyto("a-1", "2026-10-24T11:00:00.000Z", "Liisa"), // sama kätkö, toinen löytäjä
      loyto("a-2", "2026-10-26T10:00:00.000Z"), // jälkeen
    ];
    const e = haasteenEteneminen(haaste, loydot, T("2026-10-24T12:00:00.000Z"));
    expect(e).toMatchObject({ tila: "kaynnissa", loydetty: 1, tavoite: 2, onnistui: false });
  });

  it("rajat ovat mukana ja tavoite täyttyy", () => {
    const loydot = [loyto("a-1", haaste.alku), loyto("a-2", haaste.loppu)];
    expect(haasteenEteneminen(haaste, loydot, T(haaste.loppu)).onnistui).toBe(true);
  });

  it("tila ja aikaa jäljellä", () => {
    expect(haasteenEteneminen(haaste, [], T("2026-10-23T15:00:00.000Z"))).toMatchObject({ tila: "tulossa", aikaaMs: 3_600_000 });
    expect(haasteenEteneminen(haaste, [], T("2026-10-25T17:00:00.000Z"))).toMatchObject({ tila: "kaynnissa", aikaaMs: 3_600_000 });
    expect(haasteenEteneminen(haaste, [], T("2026-10-25T19:00:00.000Z"))).toMatchObject({ tila: "paattynyt", aikaaMs: 0 });
  });
});
