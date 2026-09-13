export interface LoytoPyynto {
  paikkaId: string;
  nimi: string;
}

export type ValidointiTulos =
  | { ok: true; pyynto: LoytoPyynto }
  | { ok: false; virhe: string };

const NIMI_MAX_PITUUS = 50;

export interface UusiKatkoPyynto {
  id: string;
  alue: string;
  alueVihje: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: {
    tiedostopaate: string;
    data: string;
  };
}

export type UusiKatkoValidointiTulos =
  | { ok: true; pyynto: UusiKatkoPyynto }
  | { ok: false; virhe: string };

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_MAX_PITUUS = 60;
const ALUE_MAX_PITUUS = 80;
const ALUE_VIHJE_MAX_PITUUS = 300;
const KUVAUS_MAX_PITUUS = 500;
const SALLITUT_KUVAPAATTEET = new Set(["jpg", "jpeg", "png", "webp", "svg"]);
// ~1,5 Mt dekoodattuna base64:sta, riittää valokuvalle mutta pitää
// GitHubiin tehtävän commitin kohtuullisen kokoisena.
const KUVA_MAX_BASE64_PITUUS = 2_000_000;

export function validoiUusiKatkoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): UusiKatkoValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { id, alue, alueVihje, kuvaus, lat, lng, kuva } = data as Record<string, unknown>;

  if (typeof id !== "string" || id.length > ID_MAX_PITUUS || !ID_PATTERN.test(id)) {
    return {
      ok: false,
      virhe: "id täytyy olla pieniä kirjaimia, numeroita ja väliviivoja",
    };
  }
  if (tunnetutPaikkaIdt.has(id)) {
    return { ok: false, virhe: "id on jo käytössä" };
  }

  if (typeof alue !== "string" || alue.trim().length === 0) {
    return { ok: false, virhe: "alue on pakollinen" };
  }
  if (alue.length > ALUE_MAX_PITUUS) {
    return { ok: false, virhe: `alue saa olla enintään ${ALUE_MAX_PITUUS} merkkiä` };
  }

  if (typeof alueVihje !== "string" || alueVihje.trim().length === 0) {
    return { ok: false, virhe: "alueVihje on pakollinen" };
  }
  if (alueVihje.length > ALUE_VIHJE_MAX_PITUUS) {
    return {
      ok: false,
      virhe: `alueVihje saa olla enintään ${ALUE_VIHJE_MAX_PITUUS} merkkiä`,
    };
  }

  if (typeof kuvaus !== "string" || kuvaus.trim().length === 0) {
    return { ok: false, virhe: "kuvaus on pakollinen" };
  }
  if (kuvaus.length > KUVAUS_MAX_PITUUS) {
    return { ok: false, virhe: `kuvaus saa olla enintään ${KUVAUS_MAX_PITUUS} merkkiä` };
  }

  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, virhe: "lat täytyy olla luku välillä -90..90" };
  }

  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, virhe: "lng täytyy olla luku välillä -180..180" };
  }

  if (typeof kuva !== "object" || kuva === null || Array.isArray(kuva)) {
    return { ok: false, virhe: "kuva on pakollinen" };
  }
  const { tiedostopaate, data: kuvaData } = kuva as Record<string, unknown>;

  if (
    typeof tiedostopaate !== "string" ||
    !SALLITUT_KUVAPAATTEET.has(tiedostopaate.toLowerCase())
  ) {
    return {
      ok: false,
      virhe: `kuva.tiedostopaate täytyy olla yksi: ${[...SALLITUT_KUVAPAATTEET].join(", ")}`,
    };
  }

  if (typeof kuvaData !== "string" || kuvaData.length === 0) {
    return { ok: false, virhe: "kuva.data on pakollinen" };
  }
  if (kuvaData.length > KUVA_MAX_BASE64_PITUUS) {
    return { ok: false, virhe: "kuva on liian suuri" };
  }

  return {
    ok: true,
    pyynto: {
      id,
      alue: alue.trim(),
      alueVihje: alueVihje.trim(),
      kuvaus: kuvaus.trim(),
      lat,
      lng,
      kuva: { tiedostopaate: tiedostopaate.toLowerCase(), data: kuvaData },
    },
  };
}

export interface PoistoPyynto {
  id: string;
}

export type PoistoValidointiTulos =
  | { ok: true; pyynto: PoistoPyynto }
  | { ok: false; virhe: string };

export function validoiPoistoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): PoistoValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { id } = data as Record<string, unknown>;

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, virhe: "id on pakollinen" };
  }
  if (!tunnetutPaikkaIdt.has(id)) {
    return { ok: false, virhe: "Tuntematon id" };
  }

  return { ok: true, pyynto: { id } };
}

export function validoiLoytoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): ValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { paikkaId, nimi } = data as Record<string, unknown>;

  if (typeof paikkaId !== "string" || !tunnetutPaikkaIdt.has(paikkaId)) {
    return { ok: false, virhe: "Tuntematon paikkaId" };
  }

  if (typeof nimi !== "string" || nimi.trim().length === 0) {
    return { ok: false, virhe: "nimi on pakollinen" };
  }

  if (nimi.length > NIMI_MAX_PITUUS) {
    return {
      ok: false,
      virhe: `nimi saa olla enintään ${NIMI_MAX_PITUUS} merkkiä`,
    };
  }

  return { ok: true, pyynto: { paikkaId, nimi: nimi.trim() } };
}
