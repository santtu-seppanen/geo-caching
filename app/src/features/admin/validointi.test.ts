import { describe, it, expect } from "vitest";
import {
  validoiId,
  validoiIdNimi,
  validoiIdNumero,
  rakennaId,
  alueTunnisteeksi,
  validoiAlue,
  validoiKuvaus,
  validoiLat,
  validoiLng,
  paattelKuvaPaate,
  validoiKuvaTiedosto,
  validoiAdminLomake,
  ID_MAX_PITUUS,
  ALUE_MAX_PITUUS,
  KUVAUS_MAX_PITUUS,
  KUVA_MAX_TAVUA_ALKUPERAINEN,
} from "./validointi";

describe("validoiId", () => {
  it("hyväksyy validi id:n", () => {
    expect(validoiId("uusi-katko")).toBeNull();
  });

  it("hyväksyy id:n, jossa numeroita", () => {
    expect(validoiId("katko-2025")).toBeNull();
  });

  it("hylkää tyhjän id:n", () => {
    expect(validoiId("")).not.toBeNull();
  });

  it("hylkää whitespace-ainoastaan id:n", () => {
    expect(validoiId("   ")).not.toBeNull();
  });

  it("hyväksyy id:n, jonka pituus on täsmälleen max", () => {
    const maxId = "a".repeat(ID_MAX_PITUUS);
    expect(validoiId(maxId)).toBeNull();
  });

  it("hylkää id:n, jonka pituus ylittää max", () => {
    const yliPitkaid = "a".repeat(ID_MAX_PITUUS + 1);
    expect(validoiId(yliPitkaid)).not.toBeNull();
  });

  it("hylkää id:n, jossa iso alkukirjain", () => {
    expect(validoiId("Uusi-katko")).not.toBeNull();
  });

  it("hylkää id:n, jossa välilyönti", () => {
    expect(validoiId("uusi katko")).not.toBeNull();
  });

  it("hylkää id:n, jossa alaviiva", () => {
    expect(validoiId("uusi_katko")).not.toBeNull();
  });

  it("hylkää id:n, joka alkaa väliviivalla", () => {
    expect(validoiId("-uusi-katko")).not.toBeNull();
  });

  it("hylkää id:n, joka päättyy väliviivalla", () => {
    expect(validoiId("uusi-katko-")).not.toBeNull();
  });

  it("hylkää id:n, jossa peräkkäiset väliviivat", () => {
    expect(validoiId("uusi--katko")).not.toBeNull();
  });
});

describe("validoiAlue", () => {
  it("hyväksyy validi alue:n", () => {
    expect(validoiAlue("Testialue")).toBeNull();
  });

  it("hylkää tyhjän alue:n", () => {
    expect(validoiAlue("")).not.toBeNull();
  });

  it("hylkää whitespace-ainoastaan alue:n", () => {
    expect(validoiAlue("   ")).not.toBeNull();
  });

  it("hyväksyy alue:n, jonka pituus on täsmälleen max", () => {
    const maxAlue = "a".repeat(ALUE_MAX_PITUUS);
    expect(validoiAlue(maxAlue)).toBeNull();
  });

  it("hylkää alue:n, jonka pituus ylittää max", () => {
    const yliPitkaalue = "a".repeat(ALUE_MAX_PITUUS + 1);
    expect(validoiAlue(yliPitkaalue)).not.toBeNull();
  });

  it("trimaa whitespace:n", () => {
    const virhe = validoiAlue("  validialue  ");
    expect(virhe).toBeNull();
  });
});

describe("validoiKuvaus", () => {
  it("hyväksyy validi kuvaus:en", () => {
    expect(validoiKuvaus("Tämä on kuvaus")).toBeNull();
  });

  it("hylkää tyhjän kuvaus:en", () => {
    expect(validoiKuvaus("")).not.toBeNull();
  });

  it("hylkää whitespace-ainoastaan kuvaus:en", () => {
    expect(validoiKuvaus("   ")).not.toBeNull();
  });

  it("hyväksyy kuvaus:en, jonka pituus on täsmälleen max", () => {
    const maxKuvaus = "a".repeat(KUVAUS_MAX_PITUUS);
    expect(validoiKuvaus(maxKuvaus)).toBeNull();
  });

  it("hylkää kuvaus:en, jonka pituus ylittää max", () => {
    const yliPitkaakuvaus = "a".repeat(KUVAUS_MAX_PITUUS + 1);
    expect(validoiKuvaus(yliPitkaakuvaus)).not.toBeNull();
  });
});

describe("validoiLat", () => {
  it("hyväksyy validi lat:in", () => {
    expect(validoiLat(60.1699)).toBeNull();
  });

  it("hyväksyy lat:in -90", () => {
    expect(validoiLat(-90)).toBeNull();
  });

  it("hyväksyy lat:in 90", () => {
    expect(validoiLat(90)).toBeNull();
  });

  it("hylkää null:in", () => {
    expect(validoiLat(null)).not.toBeNull();
  });

  it("hylkää lat:in alle -90", () => {
    expect(validoiLat(-91)).not.toBeNull();
  });

  it("hylkää lat:in yli 90", () => {
    expect(validoiLat(91)).not.toBeNull();
  });

  it("hylkää NaN:in", () => {
    expect(validoiLat(NaN)).not.toBeNull();
  });

  it("hylkää Infinity:n", () => {
    expect(validoiLat(Infinity)).not.toBeNull();
  });

  it("hylkää -Infinity:n", () => {
    expect(validoiLat(-Infinity)).not.toBeNull();
  });
});

describe("validoiLng", () => {
  it("hyväksyy validi lng:n", () => {
    expect(validoiLng(24.9384)).toBeNull();
  });

  it("hyväksyy lng:n -180", () => {
    expect(validoiLng(-180)).toBeNull();
  });

  it("hyväksyy lng:n 180", () => {
    expect(validoiLng(180)).toBeNull();
  });

  it("hylkää null:in", () => {
    expect(validoiLng(null)).not.toBeNull();
  });

  it("hylkää lng:n alle -180", () => {
    expect(validoiLng(-181)).not.toBeNull();
  });

  it("hylkää lng:n yli 180", () => {
    expect(validoiLng(181)).not.toBeNull();
  });

  it("hylkää NaN:in", () => {
    expect(validoiLng(NaN)).not.toBeNull();
  });

  it("hylkää Infinity:n", () => {
    expect(validoiLng(Infinity)).not.toBeNull();
  });

  it("hylkää -Infinity:n", () => {
    expect(validoiLng(-Infinity)).not.toBeNull();
  });
});

describe("paattelKuvaPaate", () => {
  it("palauttaa 'jpg' tiedostonimelle 'kuva.jpg'", () => {
    expect(paattelKuvaPaate("kuva.jpg")).toBe("jpg");
  });

  it("palauttaa 'jpeg' tiedostonimelle 'kuva.jpeg'", () => {
    expect(paattelKuvaPaate("kuva.jpeg")).toBe("jpeg");
  });

  it("palauttaa 'png' tiedostonimelle 'kuva.png'", () => {
    expect(paattelKuvaPaate("kuva.png")).toBe("png");
  });

  it("palauttaa 'webp' tiedostonimelle 'kuva.webp'", () => {
    expect(paattelKuvaPaate("kuva.webp")).toBe("webp");
  });

  it("palauttaa 'svg' tiedostonimelle 'kuva.svg'", () => {
    expect(paattelKuvaPaate("kuva.svg")).toBe("svg");
  });

  it("on case-insensitive ja palauttaa lowercase:n", () => {
    expect(paattelKuvaPaate("kuva.JPG")).toBe("jpg");
    expect(paattelKuvaPaate("kuva.JPEG")).toBe("jpeg");
    expect(paattelKuvaPaate("kuva.Png")).toBe("png");
  });

  it("palauttaa null tiedostonimelle ilman pistettä", () => {
    expect(paattelKuvaPaate("kuva")).toBeNull();
  });

  it("palauttaa null tuntemattomalle päätteelle", () => {
    expect(paattelKuvaPaate("kuva.gif")).toBeNull();
  });

  it("palauttaa null tuntemattomalle päätteelle", () => {
    expect(paattelKuvaPaate("kuva.bmp")).toBeNull();
  });

  it("käyttää viimeistä pistettä päätteen rajana", () => {
    expect(paattelKuvaPaate("kuva.varmuus.jpg")).toBe("jpg");
  });

  it("palauttaa null, jos viimeinen pääte on tuntematon", () => {
    expect(paattelKuvaPaate("kuva.jpg.pdf")).toBeNull();
  });
});

describe("validoiKuvaTiedosto", () => {
  it("hylkää null:in", () => {
    expect(validoiKuvaTiedosto(null)).not.toBeNull();
  });

  it("hyväksyy validi jpg-tiedoston", () => {
    const file = new File(["data"], "kuva.jpg", { type: "image/jpeg" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hyväksyy validi jpeg-tiedoston", () => {
    const file = new File(["data"], "kuva.jpeg", { type: "image/jpeg" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hyväksyy validi png-tiedoston", () => {
    const file = new File(["data"], "kuva.png", { type: "image/png" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hyväksyy validi webp-tiedoston", () => {
    const file = new File(["data"], "kuva.webp", { type: "image/webp" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hyväksyy validi svg-tiedoston", () => {
    const file = new File(["data"], "kuva.svg", { type: "image/svg+xml" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hylkää tiedoston ilman päätettä", () => {
    const file = new File(["data"], "kuva", { type: "image/jpeg" });
    expect(validoiKuvaTiedosto(file)).not.toBeNull();
  });

  it("hylkää tiedoston, jolla on tuntematon pääte", () => {
    const file = new File(["data"], "kuva.gif", { type: "image/gif" });
    expect(validoiKuvaTiedosto(file)).not.toBeNull();
  });

  it("hylkää tiedoston, joka ylittää koon rajaa", () => {
    const file = new File(["a".repeat(KUVA_MAX_TAVUA_ALKUPERAINEN + 1)], "kuva.jpg", {
      type: "image/jpeg",
    });
    expect(validoiKuvaTiedosto(file)).not.toBeNull();
  });

  it("hyväksyy tiedoston, jonka koko on täsmälleen max", () => {
    const file = new File(["a".repeat(KUVA_MAX_TAVUA_ALKUPERAINEN)], "kuva.jpg", {
      type: "image/jpeg",
    });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("on case-insensitive päätteelle", () => {
    const file = new File(["data"], "kuva.JPG", { type: "image/jpeg" });
    expect(validoiKuvaTiedosto(file)).toBeNull();
  });

  it("hylkää tiedoston, jolla on liian pitkä nimi mutta iso pääte", () => {
    const file = new File(["data"], "kuva.UNKNOWNEXT", { type: "image/jpeg" });
    expect(validoiKuvaTiedosto(file)).not.toBeNull();
  });
});

describe("validoiAdminLomake", () => {
  const validisyote = {
    idNimi: "uusi-katko",
    idNumero: "1",
    alue: "Testialue",
    kuvaus: "Testkuvaus",
    lat: 60.1699,
    lng: 24.9384,
    kuvaTiedosto: new File(["data"], "kuva.jpg", { type: "image/jpeg" }),
  };

  it("hyväksyy validi lomakkeen", () => {
    const virheet = validoiAdminLomake(validisyote);
    expect(virheet).toEqual({});
  });

  it("palauttaa tyhjän objektin kun lomake on validi", () => {
    const virheet = validoiAdminLomake(validisyote);
    expect(Object.keys(virheet)).toHaveLength(0);
  });

  it("kerraa idNimi:n virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      idNimi: "Iso-Alkukirjain",
    });
    expect(virheet.idNimi).toBeDefined();
  });

  it("kerraa idNumero:n virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      idNumero: "ei-numero",
    });
    expect(virheet.idNumero).toBeDefined();
  });

  it("kerraa alue:n virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      alue: "",
    });
    expect(virheet.alue).toBeDefined();
  });

  it("kerraa kuvaus:en virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      kuvaus: "",
    });
    expect(virheet.kuvaus).toBeDefined();
  });

  it("kerraa lat:in virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      lat: null,
    });
    expect(virheet.lat).toBeDefined();
  });

  it("kerraa lng:n virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      lng: null,
    });
    expect(virheet.lng).toBeDefined();
  });

  it("kerraa kuvan virhe", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      kuvaTiedosto: null,
    });
    expect(virheet.kuva).toBeDefined();
  });

  it("kerraa useammat virheet samanaikaisesti", () => {
    const virheet = validoiAdminLomake({
      idNimi: "Iso-Alkukirjain",
      idNumero: "ei-numero",
      alue: "",
      kuvaus: "",
      lat: null,
      lng: null,
      kuvaTiedosto: null,
    });

    expect(virheet.idNimi).toBeDefined();
    expect(virheet.idNumero).toBeDefined();
    expect(virheet.alue).toBeDefined();
    expect(virheet.kuvaus).toBeDefined();
    expect(virheet.lat).toBeDefined();
    expect(virheet.lng).toBeDefined();
    expect(virheet.kuva).toBeDefined();
  });

  it("ei kerraa virhettä, kun kenttä on validi", () => {
    const virheet = validoiAdminLomake({
      ...validisyote,
      idNimi: "validi-katko",
      alue: "Validi alue",
    });

    expect(virheet.idNimi).toBeUndefined();
    expect(virheet.idNumero).toBeUndefined();
    expect(virheet.alue).toBeUndefined();
  });
});

describe("validoiIdNimi", () => {
  it("hyväksyy validin nimen", () => {
    expect(validoiIdNimi("neittava")).toBeNull();
    expect(validoiIdNimi("lammin-honka")).toBeNull();
  });

  it("hylkää tyhjän nimen", () => {
    expect(validoiIdNimi("")).not.toBeNull();
    expect(validoiIdNimi("   ")).not.toBeNull();
  });

  it("hylkää ison alkukirjaimen", () => {
    expect(validoiIdNimi("Neittava")).not.toBeNull();
  });

  it("hylkää välilyönnin", () => {
    expect(validoiIdNimi("neittava metsä")).not.toBeNull();
  });
});

describe("validoiIdNumero", () => {
  it("hyväksyy numeron", () => {
    expect(validoiIdNumero("1")).toBeNull();
    expect(validoiIdNumero("42")).toBeNull();
  });

  it("hylkää tyhjän numeron", () => {
    expect(validoiIdNumero("")).not.toBeNull();
  });

  it("hylkää ei-numeerisen arvon", () => {
    expect(validoiIdNumero("1a")).not.toBeNull();
    expect(validoiIdNumero("yksi")).not.toBeNull();
  });
});

describe("rakennaId", () => {
  it("yhdistää nimen ja numeron väliviivalla", () => {
    expect(rakennaId("neittava", "1")).toBe("neittava-1");
  });

  it("trimmaa whitespace:n", () => {
    expect(rakennaId(" neittava ", " 1 ")).toBe("neittava-1");
  });
});

describe("alueTunnisteeksi", () => {
  it("muuttaa ison alkukirjaimen pieneksi", () => {
    expect(alueTunnisteeksi("Neittävä")).toBe("neittava");
  });

  it("poistaa ääkköset", () => {
    expect(alueTunnisteeksi("Äpätti")).toBe("apatti");
    expect(alueTunnisteeksi("Ölmävä")).toBe("olmava");
    expect(alueTunnisteeksi("Åkerby")).toBe("akerby");
  });

  it("korvaa välilyönnit ja muut erikoismerkit yhdellä väliviivalla", () => {
    expect(alueTunnisteeksi("Lammin metsä")).toBe("lammin-metsa");
    expect(alueTunnisteeksi("Ylä-Kitka")).toBe("yla-kitka");
    expect(alueTunnisteeksi("Metsä & Järvi!")).toBe("metsa-jarvi");
  });

  it("trimmaa reunat ja tuplaväliviivat", () => {
    expect(alueTunnisteeksi("  Neittävä  ")).toBe("neittava");
    expect(alueTunnisteeksi("-Neittävä-")).toBe("neittava");
  });

  it("palauttaa tyhjän merkkijonon, jos mitään käyttökelpoista ei jää jäljelle", () => {
    expect(alueTunnisteeksi("!!!")).toBe("");
    expect(alueTunnisteeksi("")).toBe("");
  });

  it("säilyttää numerot", () => {
    expect(alueTunnisteeksi("3 Veljestä")).toBe("3-veljesta");
  });
});
