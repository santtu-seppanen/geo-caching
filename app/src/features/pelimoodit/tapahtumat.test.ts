import { describe, it, expect } from "vitest";
import { pelitapahtuma, type TapahtumaTila } from "./tapahtumat";

const tila = (o: Partial<TapahtumaTila>): TapahtumaTila => ({
  moodi: "vihjeet",
  vuoroAlkoi: 1000,
  avautuneitaVihjeita: 1,
  ohitettuja: 0,
  ...o,
});

describe("pelitapahtuma", () => {
  it("ei viestiä ensimmäisestä tilasta eikä muuttumattomasta", () => {
    expect(pelitapahtuma(null, tila({}))).toBeNull();
    expect(pelitapahtuma(tila({}), tila({}))).toBeNull();
  });

  it("uusi vihje ja viimeinen vihje", () => {
    expect(pelitapahtuma(tila({}), tila({ avautuneitaVihjeita: 2 }))).toBe("Uusi vihje! Ympyrä kutistui.");
    expect(pelitapahtuma(tila({ avautuneitaVihjeita: 2 }), tila({ avautuneitaVihjeita: 3 }))).toMatch(/Viimeinen vihje/);
  });

  it("ei viestiä kun etsintä aloitetaan alusta (vuoron alku vaihtuu)", () => {
    expect(pelitapahtuma(tila({ avautuneitaVihjeita: 3 }), tila({ vuoroAlkoi: 9000, avautuneitaVihjeita: 1 }))).toBeNull();
    expect(pelitapahtuma(tila({ vuoroAlkoi: null, avautuneitaVihjeita: 0 }), tila({ vuoroAlkoi: 9000, avautuneitaVihjeita: 1 }))).toBeNull();
  });

  it("ajastetussa ohitus kasvattaa, alusta aloitus (lasku) ei", () => {
    const a = tila({ moodi: "ajastettu" });
    expect(pelitapahtuma(a, { ...a, ohitettuja: 1 })).toBe("Aika loppui — kätkö ohitettu!");
    expect(pelitapahtuma({ ...a, ohitettuja: 2 }, { ...a, ohitettuja: 0 })).toBeNull();
  });

  it("ei viestiä moodin vaihtuessa tai vapaassa moodissa", () => {
    expect(pelitapahtuma(tila({ moodi: "vapaa" }), tila({ moodi: "vihjeet", avautuneitaVihjeita: 2 }))).toBeNull();
    expect(pelitapahtuma(tila({ moodi: "vapaa" }), tila({ moodi: "vapaa", avautuneitaVihjeita: 2, ohitettuja: 3 }))).toBeNull();
  });
});
