import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { haePelaajanNimi, tallennaPelaajanNimi } from "./pelaajanNimi";

/**
 * Node 25:n sisäänrakennettu globaali localStorage ei toimi luotettavasti
 * tässä testiympäristössä (kirjoitukset eivät pysy muistissa ilman
 * --localstorage-file-lippua), ja se peittää jsdomin oman toteutuksen.
 * Korvataan se yksinkertaisella muistivarastolla vain näiden testien ajaksi.
 */
function luoMuistivarasto(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (avain: string) => data.get(avain) ?? null,
    setItem: (avain: string, arvo: string) => {
      data.set(avain, arvo);
    },
    removeItem: (avain: string) => {
      data.delete(avain);
    },
    clear: () => data.clear(),
    key: (indeksi: number) => [...data.keys()][indeksi] ?? null,
    get length() {
      return data.size;
    },
  };
}

describe("pelaajanNimi", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", luoMuistivarasto());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("palauttaa tyhjän merkkijonon kun nimeä ei ole vielä tallennettu", () => {
    expect(haePelaajanNimi()).toBe("");
  });

  it("tallentaa ja hakee nimen", () => {
    tallennaPelaajanNimi("KätköKettu99");

    expect(haePelaajanNimi()).toBe("KätköKettu99");
  });

  it("ylikirjoittaa aiemman tallennetun nimen", () => {
    tallennaPelaajanNimi("Ensimmäinen");
    tallennaPelaajanNimi("Toinen");

    expect(haePelaajanNimi()).toBe("Toinen");
  });
});
