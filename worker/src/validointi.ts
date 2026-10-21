export interface LoytoPyynto {
  paikkaId: string;
  nimi: string;
  /** Löytöön kulunut aika (ms), null jos etsintää ei ollut aloitettu. */
  kestoMs: number | null;
  /** Vapaaehtoinen kommentti, null jos tyhjä. */
  kommentti: string | null;
  /** Löytöhetki (ISO), jos client ilmoitti sen (offline-jonotettu löytö), muuten null = nyt. */
  aika: string | null;
  /** Pelaajan sijainti löytöhetkellä — worker vertaa sitä kätkön koordinaatteihin. null jos puuttuu. */
  sijainti: { lat: number; lng: number } | null;
}

/**
 * Suurin sallittu etäisyys kätköstä löydön kirjaushetkellä. Hieman
 * KATKO_AVAUTUU_METREINA:a (100 m, ks. app/src/features/etsi/kynnykset.ts)
 * suurempi, jotta GPS:n epätarkkuus ei estä oikeaa löytöä.
 */
export const LOYTO_MAX_ETAISYYS_M = 150;

export function etaisyysMetreina(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sinDLat = Math.sin(toRad(b.lat - a.lat) / 2);
  const sinDLng = Math.sin(toRad(b.lng - a.lng) / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Etsinnän ehdoton takaraja aloituksesta — sama kuin frontendin
 * ETSINTA_MAX_MS (ks. app/src/features/pelimoodit/etsinta.ts). Worker
 * luottaa clientin ilmoittamiin aikoihin, mutta ei hyväksy niitä yli
 * takarajan.
 */
export const ETSINTA_MAX_MS = 3 * 60 * 60 * 1000;

export type ValidointiTulos =
  | { ok: true; pyynto: LoytoPyynto }
  | { ok: false; virhe: string };

const NIMI_MAX_PITUUS = 50;
export const KOMMENTTI_MAX_PITUUS = 140;
/** Offline-jonotetun löydön löytöhetki saa olla enintään näin vanha. */
export const AIKA_MAX_IKA_MS = 7 * 24 * 60 * 60 * 1000;

export interface UusiKatkoPyynto {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: {
    tiedostopaate: string;
    data: string;
  };
  piilotaLahimmasta: boolean;
  pullonKokoMl: number | null;
}

export type UusiKatkoValidointiTulos =
  | { ok: true; pyynto: UusiKatkoPyynto }
  | { ok: false; virhe: string };

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_MAX_PITUUS = 60;
const ALUE_MAX_PITUUS = 80;
const KUVAUS_MAX_PITUUS = 500;
const SALLITUT_KUVAPAATTEET = new Set(["jpg", "jpeg", "png", "webp", "svg"]);
// ~3 Mt dekoodattuna base64:sta. Frontend pakkaa kamerakuvat tätä
// pienemmiksi ennen lähetystä (ks. app/src/features/admin/kuvaPakkaus.ts),
// tämä on vain viimeinen turvaraja R2-tallennuksen ja Workerin
// pyyntökoon varalle.
const KUVA_MAX_BASE64_PITUUS = 4_000_000;

/**
 * Sallitut pullon koot millilitroina — sama lista kuin admin-lomakkeen
 * valikossa (ks. app/src/features/paikat/pullonKoko.ts). Kiinteä lista
 * eikä vapaa luku, koska kenttä täytetään aina valikosta.
 */
export const SALLITUT_PULLON_KOOT_ML = new Set([50, 200, 350, 500, 700, 750, 1000]);

interface PerusKentat {
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  piilotaLahimmasta: boolean;
  pullonKokoMl: number | null;
}

type PerusKenttienValidointiTulos =
  | { ok: true; kentat: PerusKentat }
  | { ok: false; virhe: string };

/** Yhteinen alue/kuvaus/lat/lng-validointi uuden ja muokatun kätkön pyynnöille. */
function validoiPerusKentat(data: Record<string, unknown>): PerusKenttienValidointiTulos {
  const { alue, kuvaus, lat, lng, piilotaLahimmasta, pullonKokoMl } = data;

  if (typeof alue !== "string" || alue.trim().length === 0) {
    return { ok: false, virhe: "alue on pakollinen" };
  }
  if (alue.length > ALUE_MAX_PITUUS) {
    return { ok: false, virhe: `alue saa olla enintään ${ALUE_MAX_PITUUS} merkkiä` };
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

  if (piilotaLahimmasta !== undefined && typeof piilotaLahimmasta !== "boolean") {
    return { ok: false, virhe: "piilotaLahimmasta täytyy olla totuusarvo" };
  }

  if (
    pullonKokoMl !== undefined &&
    pullonKokoMl !== null &&
    (typeof pullonKokoMl !== "number" || !SALLITUT_PULLON_KOOT_ML.has(pullonKokoMl))
  ) {
    return { ok: false, virhe: "pullonKokoMl on tuntematon pullon koko" };
  }

  return {
    ok: true,
    kentat: {
      alue: alue.trim(),
      kuvaus: kuvaus.trim(),
      lat,
      lng,
      piilotaLahimmasta: piilotaLahimmasta === true,
      pullonKokoMl: pullonKokoMl ?? null,
    },
  };
}

interface KuvaKentta {
  tiedostopaate: string;
  data: string;
}

type KuvaValidointiTulos =
  | { ok: true; kuva: KuvaKentta }
  | { ok: false; virhe: string };

/** Validoi kuva-kentän ({tiedostopaate, data}-muotoinen). */
function validoiKuvaKentta(kuva: unknown): KuvaValidointiTulos {
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
    kuva: { tiedostopaate: tiedostopaate.toLowerCase(), data: kuvaData },
  };
}

export function validoiUusiKatkoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): UusiKatkoValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const kentta = data as Record<string, unknown>;
  const { id, kuva } = kentta;

  if (typeof id !== "string" || id.length > ID_MAX_PITUUS || !ID_PATTERN.test(id)) {
    return {
      ok: false,
      virhe: "id täytyy olla pieniä kirjaimia, numeroita ja väliviivoja",
    };
  }
  if (tunnetutPaikkaIdt.has(id)) {
    return { ok: false, virhe: "id on jo käytössä" };
  }

  const perusTulos = validoiPerusKentat(kentta);
  if (!perusTulos.ok) return perusTulos;

  const kuvaTulos = validoiKuvaKentta(kuva);
  if (!kuvaTulos.ok) return kuvaTulos;

  return {
    ok: true,
    pyynto: { id, ...perusTulos.kentat, kuva: kuvaTulos.kuva },
  };
}

export interface MuokkausKatkoPyynto {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: { tiedostopaate: string; data: string } | null;
  piilotaLahimmasta: boolean;
  pullonKokoMl: number | null;
}

export type MuokkausKatkoValidointiTulos =
  | { ok: true; pyynto: MuokkausKatkoPyynto }
  | { ok: false; virhe: string };

/**
 * Validoi olemassa olevan kätkön muokkauspyynnön. Kuva on valinnainen —
 * `null`/puuttuva tarkoittaa, että nykyinen kuva säilytetään.
 */
export function validoiMuokkausKatkoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): MuokkausKatkoValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const kentta = data as Record<string, unknown>;
  const { id, kuva } = kentta;

  if (typeof id !== "string" || !tunnetutPaikkaIdt.has(id)) {
    return { ok: false, virhe: "Tuntematon id" };
  }

  const perusTulos = validoiPerusKentat(kentta);
  if (!perusTulos.ok) return perusTulos;

  if (kuva === null || kuva === undefined) {
    return { ok: true, pyynto: { id, ...perusTulos.kentat, kuva: null } };
  }

  const kuvaTulos = validoiKuvaKentta(kuva);
  if (!kuvaTulos.ok) return kuvaTulos;

  return {
    ok: true,
    pyynto: { id, ...perusTulos.kentat, kuva: kuvaTulos.kuva },
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

  const { paikkaId, nimi, kestoMs, etsintaKestoMs, lat, lng, kommentti, aika } = data as Record<string, unknown>;

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

  if (kestoMs !== undefined && kestoMs !== null) {
    if (!onKesto(kestoMs) || !onKesto(etsintaKestoMs)) {
      return { ok: false, virhe: "kestoMs ja etsintaKestoMs täytyy olla ei-negatiivisia kokonaislukuja" };
    }
    if (etsintaKestoMs > ETSINTA_MAX_MS) {
      return { ok: false, virhe: "Etsinnän 3 tunnin takaraja on ylittynyt" };
    }
    if (kestoMs > etsintaKestoMs) {
      return { ok: false, virhe: "kestoMs ei voi olla pidempi kuin etsintaKestoMs" };
    }
  }

  let siistittyKommentti: string | null = null;
  if (kommentti !== undefined && kommentti !== null) {
    if (typeof kommentti !== "string") {
      return { ok: false, virhe: "kommentti täytyy olla merkkijono" };
    }
    if (kommentti.trim().length > KOMMENTTI_MAX_PITUUS) {
      return { ok: false, virhe: `kommentti saa olla enintään ${KOMMENTTI_MAX_PITUUS} merkkiä` };
    }
    siistittyKommentti = kommentti.trim() || null;
  }

  let siistittyAika: string | null = null;
  if (aika !== undefined && aika !== null) {
    const ms = typeof aika === "string" ? Date.parse(aika) : NaN;
    const nyt = Date.now();
    if (Number.isNaN(ms) || ms > nyt + 60_000 || ms < nyt - AIKA_MAX_IKA_MS) {
      return { ok: false, virhe: "aika täytyy olla ISO-aikaleima viimeisen 7 päivän ajalta" };
    }
    siistittyAika = new Date(ms).toISOString();
  }

  let sijainti: { lat: number; lng: number } | null = null;
  if (lat !== undefined || lng !== undefined) {
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, virhe: "lat ja lng täytyy olla lukuja" };
    }
    sijainti = { lat, lng };
  }

  return { ok: true, pyynto: { paikkaId, nimi: nimi.trim(), kestoMs: kestoMs ?? null, kommentti: siistittyKommentti, aika: siistittyAika, sijainti } };
}

function onKesto(arvo: unknown): arvo is number {
  return typeof arvo === "number" && Number.isInteger(arvo) && arvo >= 0;
}

/** Sama lista kuin frontendin PELIMOODIT (ks. app/src/features/pelimoodit/pelimoodit.ts). */
export const SALLITUT_PELIMOODIT = new Set(["vapaa", "yksi-kerrallaan", "ajastettu", "kolmiomittaus", "vihjeet"]);

export interface PelimoodiPyynto {
  alueAvain: string;
  pelimoodi: string;
}

export type PelimoodiValidointiTulos =
  | { ok: true; pyynto: PelimoodiPyynto }
  | { ok: false; virhe: string };

export function validoiPelimoodiPyynto(data: unknown): PelimoodiValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { alueAvain, pelimoodi } = data as Record<string, unknown>;

  if (typeof alueAvain !== "string" || alueAvain.trim().length === 0) {
    return { ok: false, virhe: "alueAvain on pakollinen" };
  }
  if (alueAvain.length > ALUE_MAX_PITUUS) {
    return { ok: false, virhe: `alueAvain saa olla enintään ${ALUE_MAX_PITUUS} merkkiä` };
  }

  if (typeof pelimoodi !== "string" || !SALLITUT_PELIMOODIT.has(pelimoodi)) {
    return { ok: false, virhe: "Tuntematon pelimoodi" };
  }

  return { ok: true, pyynto: { alueAvain: alueAvain.trim(), pelimoodi } };
}

export const HAASTE_NIMI_MAX_PITUUS = 60;
export const HAASTE_TAVOITE_MAX = 1000;

export interface Haaste {
  nimi: string;
  /** ISO-aikaleimat; loppu on aina alun jälkeen. */
  alku: string;
  loppu: string;
  /** Montako eri kätköä pitää löytää haasteen aikana. */
  tavoite: number;
}

export type HaasteValidointiTulos =
  | { ok: true; haaste: Haaste | null }
  | { ok: false; virhe: string };

/** `{ poista: true }` tyhjentää haasteen (haaste: null), muuten validoidaan uusi haaste. */
export function validoiHaastePyynto(data: unknown): HaasteValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }
  const { poista, nimi, alku, loppu, tavoite } = data as Record<string, unknown>;

  if (poista === true) return { ok: true, haaste: null };

  if (typeof nimi !== "string" || nimi.trim().length === 0) {
    return { ok: false, virhe: "nimi on pakollinen" };
  }
  if (nimi.trim().length > HAASTE_NIMI_MAX_PITUUS) {
    return { ok: false, virhe: `nimi saa olla enintään ${HAASTE_NIMI_MAX_PITUUS} merkkiä` };
  }

  const alkuMs = typeof alku === "string" ? Date.parse(alku) : NaN;
  const loppuMs = typeof loppu === "string" ? Date.parse(loppu) : NaN;
  if (Number.isNaN(alkuMs) || Number.isNaN(loppuMs)) {
    return { ok: false, virhe: "alku ja loppu täytyy olla ISO-aikaleimoja" };
  }
  if (loppuMs <= alkuMs) {
    return { ok: false, virhe: "loppu täytyy olla alun jälkeen" };
  }

  if (typeof tavoite !== "number" || !Number.isInteger(tavoite) || tavoite < 1 || tavoite > HAASTE_TAVOITE_MAX) {
    return { ok: false, virhe: `tavoite täytyy olla kokonaisluku 1–${HAASTE_TAVOITE_MAX}` };
  }

  return {
    ok: true,
    haaste: {
      nimi: nimi.trim(),
      alku: new Date(alkuMs).toISOString(),
      loppu: new Date(loppuMs).toISOString(),
      tavoite,
    },
  };
}

export interface EtsinnanAloitusPyynto {
  /** Laitteen satunnainen tunniste (ks. app/src/lib/laiteId.ts). */
  laiteId: string;
  alueAvain: string;
  /** Pelaajan nimimerkki, null jos sitä ei ole vielä annettu. */
  nimi: string | null;
}

export type EtsinnanAloitusValidointiTulos =
  | { ok: true; pyynto: EtsinnanAloitusPyynto }
  | { ok: false; virhe: string };

const LAITE_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function validoiEtsinnanAloitusPyynto(data: unknown): EtsinnanAloitusValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { laiteId, alueAvain, nimi } = data as Record<string, unknown>;

  if (typeof laiteId !== "string" || !LAITE_ID_PATTERN.test(laiteId)) {
    return { ok: false, virhe: "laiteId on virheellinen" };
  }

  if (typeof alueAvain !== "string" || alueAvain.trim().length === 0) {
    return { ok: false, virhe: "alueAvain on pakollinen" };
  }
  if (alueAvain.length > ALUE_MAX_PITUUS) {
    return { ok: false, virhe: `alueAvain saa olla enintään ${ALUE_MAX_PITUUS} merkkiä` };
  }

  if (nimi !== undefined && nimi !== null && typeof nimi !== "string") {
    return { ok: false, virhe: "nimi täytyy olla merkkijono" };
  }
  const siistiNimi = typeof nimi === "string" ? nimi.trim() : "";
  if (siistiNimi.length > NIMI_MAX_PITUUS) {
    return { ok: false, virhe: `nimi saa olla enintään ${NIMI_MAX_PITUUS} merkkiä` };
  }

  return {
    ok: true,
    pyynto: { laiteId, alueAvain: alueAvain.trim(), nimi: siistiNimi || null },
  };
}

export interface EtsinnanSijaintiPyynto extends EtsinnanAloitusPyynto {
  lat: number;
  lng: number;
}

export type EtsinnanSijaintiValidointiTulos =
  | { ok: true; pyynto: EtsinnanSijaintiPyynto }
  | { ok: false; virhe: string };

/** Kuten aloitus, lisäksi pakollinen lat/lng. */
export function validoiEtsinnanSijaintiPyynto(data: unknown): EtsinnanSijaintiValidointiTulos {
  const perus = validoiEtsinnanAloitusPyynto(data);
  if (!perus.ok) return perus;

  const { lat, lng } = data as Record<string, unknown>;
  if (typeof lat !== "number" || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, virhe: "lat täytyy olla luku välillä -90..90" };
  }
  if (typeof lng !== "number" || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { ok: false, virhe: "lng täytyy olla luku välillä -180..180" };
  }

  return { ok: true, pyynto: { ...perus.pyynto, lat, lng } };
}
