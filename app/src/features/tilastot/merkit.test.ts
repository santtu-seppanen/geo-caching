import { describe, it, expect } from "vitest";
import { ansaitutMerkit, NOPEA_NAPPAUS_MAX_MS } from "./merkit";
import type { Loyto, Paikka } from "../paikat/types";

const paikka = (id: string, alue = "Neittävä"): Paikka =>
  ({ id, alue, kuvaus: "", lat: 0, lng: 0, kuva: "" }) as Paikka;

// Keskipäivä paikallista aikaa, ettei yömerkki aktivoidu vahingossa.
const PAIVA = new Date(2026, 5, 1, 12, 0).toISOString();
const loyto = (o: Partial<Loyto>): Loyto => ({ paikkaId: "n-1", nimi: "Matti", aika: PAIVA, ...o });
const nimet = (l: Loyto, p: Paikka[], k: Loyto[]) => ansaitutMerkit(l, p, k).map((m) => m.id);

describe("ansaitutMerkit", () => {
  it("ei merkkejä tavallisesta löydöstä", () => {
    const l = loyto({});
    expect(nimet(l, [paikka("n-1"), paikka("n-2")], [l])).toEqual([]);
  });

  it("alue valloitettu kun pelaaja on löytänyt kaikki alueen kätköt", () => {
    const paikat = [paikka("n-1"), paikka("n-2")];
    const l2 = loyto({ paikkaId: "n-2" });
    expect(nimet(l2, paikat, [loyto({ nimi: "matti" }), l2])).toContain("alue-valloitettu");
  });

  it("ei valloitusta jos toinen pelaaja löysi osan tai alueella on vain yksi kätkö", () => {
    const paikat = [paikka("n-1"), paikka("n-2")];
    const l2 = loyto({ paikkaId: "n-2" });
    expect(nimet(l2, paikat, [loyto({ nimi: "Liisa" }), l2])).not.toContain("alue-valloitettu");
    expect(nimet(loyto({}), [paikka("n-1")], [loyto({})])).not.toContain("alue-valloitettu");
  });

  it("yökätköilijä klo 00–04:59 mutta ei 05:00", () => {
    const yolla = new Date(2026, 5, 1, 4, 59).toISOString();
    const aamulla = new Date(2026, 5, 1, 5, 0).toISOString();
    expect(nimet(loyto({ aika: yolla }), [paikka("n-1")], [])).toContain("yokatkoilija");
    expect(nimet(loyto({ aika: aamulla }), [paikka("n-1")], [])).not.toContain("yokatkoilija");
  });

  it("nopea nappaus rajalla mutta ei yli, eikä ilman kestoa", () => {
    const p = [paikka("n-1")];
    expect(nimet(loyto({ kestoMs: NOPEA_NAPPAUS_MAX_MS }), p, [])).toContain("nopea-nappaus");
    expect(nimet(loyto({ kestoMs: NOPEA_NAPPAUS_MAX_MS + 1 }), p, [])).not.toContain("nopea-nappaus");
    expect(nimet(loyto({ kestoMs: null }), p, [])).not.toContain("nopea-nappaus");
  });
});
