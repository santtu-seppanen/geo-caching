import { describe, it, expect } from "vitest";
import { validoiLoytoPyynto, validoiUusiKatkoPyynto } from "./validointi";

describe("validoiLoytoPyynto", () => {
  const tunnetutPaikkaIdt = new Set(["paikka-1", "paikka-2", "paikka-3"]);

  it("hyväksyy validi pyynnön", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.paikkaId).toBe("paikka-1");
      expect(tulos.pyynto.nimi).toBe("Löytäjä");
    }
  });

  it("trimmaa whitespace:sta nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "  Löytäjä  " },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.nimi).toBe("Löytäjä");
    }
  });

  it("hylkää tuntemattoman paikkaId:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "tuntematon-paikka", nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää tyhjän nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää whitespace-ainoastaan nimi:n", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: "   " },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää liian pitkän nimi:n", () => {
    const liianPitkaNimi = "a".repeat(51);
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: liianPitkaNimi },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi saa olla enintään 50 merkkiä");
    }
  });

  it("hyväksyy täsmälleen max-pituuden nimi:n", () => {
    const maxPituusNimi = "a".repeat(50);
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: maxPituusNimi },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.nimi).toBe(maxPituusNimi);
    }
  });

  it("hylkää null:in", () => {
    const tulos = validoiLoytoPyynto(null, tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää listan", () => {
    const tulos = validoiLoytoPyynto(
      ["paikka-1", "Löytäjä"],
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää merkkijonon", () => {
    const tulos = validoiLoytoPyynto("paikka-1", tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää numeron", () => {
    const tulos = validoiLoytoPyynto(123, tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
    }
  });

  it("hylkää objektin ilman paikkaId:tä", () => {
    const tulos = validoiLoytoPyynto(
      { nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää objektin ilman nimi:ä", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });

  it("hylkää objektin, jossa paikkaId on ei-merkkijono", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: 123, nimi: "Löytäjä" },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("Tuntematon paikkaId");
    }
  });

  it("hylkää objektin, jossa nimi on ei-merkkijono", () => {
    const tulos = validoiLoytoPyynto(
      { paikkaId: "paikka-1", nimi: 123 },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(false);
    if (!tulos.ok) {
      expect(tulos.virhe).toBe("nimi on pakollinen");
    }
  });
});

describe("validoiUusiKatkoPyynto", () => {
  const tunnetutPaikkaIdt = new Set(["katko-1", "katko-2"]);

  const validipyynto = {
    id: "uusi-katko",
    alue: "Testialue",
    alueVihje: "Testivihje",
    kuvaus: "Testkuvaus",
    lat: 60.1699,
    lng: 24.9384,
    kuva: {
      tiedostopaate: "jpg",
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  };

  it("hyväksyy validi pyynnön", () => {
    const tulos = validoiUusiKatkoPyynto(validipyynto, tunnetutPaikkaIdt);

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.id).toBe("uusi-katko");
      expect(tulos.pyynto.alue).toBe("Testialue");
      expect(tulos.pyynto.lat).toBe(60.1699);
    }
  });

  it("trimmaa whitespace:sta alue, alueVihje ja kuvaus", () => {
    const tulos = validoiUusiKatkoPyynto(
      {
        ...validipyynto,
        alue: "  Testialue  ",
        alueVihje: "  Testivihje  ",
        kuvaus: "  Testkuvaus  ",
      },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.alue).toBe("Testialue");
      expect(tulos.pyynto.alueVihje).toBe("Testivihje");
      expect(tulos.pyynto.kuvaus).toBe("Testkuvaus");
    }
  });

  it("lowercasee kuvan tiedostopaatteen", () => {
    const tulos = validoiUusiKatkoPyynto(
      {
        ...validipyynto,
        kuva: {
          tiedostopaate: "JPG",
          data: validipyynto.kuva.data,
        },
      },
      tunnetutPaikkaIdt
    );

    expect(tulos.ok).toBe(true);
    if (tulos.ok) {
      expect(tulos.pyynto.kuva.tiedostopaate).toBe("jpg");
    }
  });

  describe("id validointi", () => {
    it("hylkää tyhjän id:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: "" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("pieniä kirjaimia");
      }
    });

    it("hylkää id:n, jossa iso alkukirjain", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: "Uusi-katko" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("pieniä kirjaimia");
      }
    });

    it("hylkää id:n, jossa välilyönti", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: "uusi katko" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("pieniä kirjaimia");
      }
    });

    it("hylkää id:n, jossa alaviiva", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: "uusi_katko" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("pieniä kirjaimia");
      }
    });

    it("hyväksyy id:n, jonka pituus on täsmälleen 60 merkkiä", () => {
      const maxId = "a".repeat(60);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: maxId },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää id:n, jonka pituus ylittää 60 merkkiä", () => {
      const yliPitkaid = "a".repeat(61);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: yliPitkaid },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("pieniä kirjaimia");
      }
    });

    it("hylkää tunnetun id:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, id: "katko-1" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("id on jo käytössä");
      }
    });
  });

  describe("alue validointi", () => {
    it("hylkää tyhjän alue:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alue: "" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("alue on pakollinen");
      }
    });

    it("hylkää whitespace-ainoastaan alue:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alue: "   " },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("alue on pakollinen");
      }
    });

    it("hyväksyy alue:n, jonka pituus on täsmälleen 80 merkkiä", () => {
      const maxAlue = "a".repeat(80);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alue: maxAlue },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää alue:n, jonka pituus ylittää 80 merkkiä", () => {
      const yliPitkaalue = "a".repeat(81);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alue: yliPitkaalue },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("enintään 80");
      }
    });
  });

  describe("alueVihje validointi", () => {
    it("hylkää tyhjän alueVihje:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alueVihje: "" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("alueVihje on pakollinen");
      }
    });

    it("hylkää whitespace-ainoastaan alueVihje:n", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alueVihje: "   " },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("alueVihje on pakollinen");
      }
    });

    it("hyväksyy alueVihje:n, jonka pituus on täsmälleen 300 merkkiä", () => {
      const maxVihje = "a".repeat(300);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alueVihje: maxVihje },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää alueVihje:n, jonka pituus ylittää 300 merkkiä", () => {
      const yliPitkaavihje = "a".repeat(301);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, alueVihje: yliPitkaavihje },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("enintään 300");
      }
    });
  });

  describe("kuvaus validointi", () => {
    it("hylkää tyhjän kuvaus:en", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, kuvaus: "" },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("kuvaus on pakollinen");
      }
    });

    it("hylkää whitespace-ainoastaan kuvaus:en", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, kuvaus: "   " },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("kuvaus on pakollinen");
      }
    });

    it("hyväksyy kuvaus:en, jonka pituus on täsmälleen 500 merkkiä", () => {
      const maxKuvaus = "a".repeat(500);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, kuvaus: maxKuvaus },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää kuvaus:en, jonka pituus ylittää 500 merkkiä", () => {
      const yliPitkaakuvaus = "a".repeat(501);
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, kuvaus: yliPitkaakuvaus },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("enintään 500");
      }
    });
  });

  describe("lat validointi", () => {
    it("hyväksyy lat:in -90", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: -90 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hyväksyy lat:in 90", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: 90 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää lat:in, joka on alle -90", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: -91 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -90..90");
      }
    });

    it("hylkää lat:in, joka on yli 90", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: 91 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -90..90");
      }
    });

    it("hylkää NaN:in lat:issa", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: NaN },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -90..90");
      }
    });

    it("hylkää Infinity:n lat:issa", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lat: Infinity },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -90..90");
      }
    });
  });

  describe("lng validointi", () => {
    it("hyväksyy lng:n -180", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: -180 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hyväksyy lng:n 180", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: 180 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });

    it("hylkää lng:n, joka on alle -180", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: -181 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -180..180");
      }
    });

    it("hylkää lng:n, joka on yli 180", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: 181 },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -180..180");
      }
    });

    it("hylkää NaN:in lng:ssä", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: NaN },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -180..180");
      }
    });

    it("hylkää Infinity:n lng:ssä", () => {
      const tulos = validoiUusiKatkoPyynto(
        { ...validipyynto, lng: Infinity },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("välillä -180..180");
      }
    });
  });

  describe("kuva validointi", () => {
    it("hylkää kuvan, jonka tiedostopaate on tuntematon", () => {
      const tulos = validoiUusiKatkoPyynto(
        {
          ...validipyynto,
          kuva: { tiedostopaate: "gif", data: validipyynto.kuva.data },
        },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toContain("jpg, jpeg, png, webp, svg");
      }
    });

    it("hyväksyy kuvan, jonka tiedostopaate on iso iso (case-insensitive)", () => {
      const tulos = validoiUusiKatkoPyynto(
        {
          ...validipyynto,
          kuva: { tiedostopaate: "JPEG", data: validipyynto.kuva.data },
        },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
      if (tulos.ok) {
        expect(tulos.pyynto.kuva.tiedostopaate).toBe("jpeg");
      }
    });

    it("hyväksyy kaikki sallitut tiedostopaatteet", () => {
      const paatteet = ["jpg", "jpeg", "png", "webp", "svg"];
      for (const paate of paatteet) {
        const tulos = validoiUusiKatkoPyynto(
          {
            ...validipyynto,
            kuva: { tiedostopaate: paate, data: validipyynto.kuva.data },
          },
          tunnetutPaikkaIdt
        );

        expect(tulos.ok).toBe(true);
      }
    });

    it("hylkää kuvan, jonka data on tyhjä", () => {
      const tulos = validoiUusiKatkoPyynto(
        {
          ...validipyynto,
          kuva: { tiedostopaate: "jpg", data: "" },
        },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("kuva.data on pakollinen");
      }
    });

    it("hylkää kuvan, jonka data ylittää max-koko", () => {
      const liianSuuriData = "a".repeat(2_000_001);
      const tulos = validoiUusiKatkoPyynto(
        {
          ...validipyynto,
          kuva: { tiedostopaate: "jpg", data: liianSuuriData },
        },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("kuva on liian suuri");
      }
    });

    it("hyväksyy kuvan, jonka data on täsmälleen max-koko", () => {
      const maxData = "a".repeat(2_000_000);
      const tulos = validoiUusiKatkoPyynto(
        {
          ...validipyynto,
          kuva: { tiedostopaate: "jpg", data: maxData },
        },
        tunnetutPaikkaIdt
      );

      expect(tulos.ok).toBe(true);
    });
  });

  describe("syötteen tyyppi", () => {
    it("hylkää null:in", () => {
      const tulos = validoiUusiKatkoPyynto(null, tunnetutPaikkaIdt);

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
      }
    });

    it("hylkää listan", () => {
      const tulos = validoiUusiKatkoPyynto([], tunnetutPaikkaIdt);

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
      }
    });

    it("hylkää merkkijonon", () => {
      const tulos = validoiUusiKatkoPyynto("pyynnon", tunnetutPaikkaIdt);

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
      }
    });

    it("hylkää numeron", () => {
      const tulos = validoiUusiKatkoPyynto(123, tunnetutPaikkaIdt);

      expect(tulos.ok).toBe(false);
      if (!tulos.ok) {
        expect(tulos.virhe).toBe("Pyyntö täytyy olla JSON-objekti");
      }
    });
  });
});
