/**
 * Client-puolen validointi admin-lomakkeelle. Peilaa workerin
 * `worker/src/validointi.ts`:n sääntöjä, jotta käyttäjä saa nopean,
 * kenttäkohtaisen palautteen ennen verkkopyyntöä — worker on silti lopullinen
 * totuus ja tarkistaa kaiken uudelleen (mm. id:n uniikkiuden).
 *
 * Pidetään erillään React-komponentista, jotta moduuli on
 * yksikkötestattavissa ilman renderöintiä.
 */

export const ID_MAX_PITUUS = 60;
export const ALUE_MAX_PITUUS = 80;
export const KUVAUS_MAX_PITUUS = 500;

/**
 * Alkuperäisen, kamerasta suoraan otetun tai galleriasta valitun tiedoston
 * maks. koko tavuina — vain järjenmukainen yläraja, koska kuva pakataan
 * (ks. kuvaPakkaus.ts) pienemmäksi ennen lähetystä.
 */
export const KUVA_MAX_TAVUA_ALKUPERAINEN = 20_000_000;

/**
 * Pakatun kuvan maks. koko tavuina ennen base64-koodausta. Base64 kasvattaa
 * kokoa ~1,33x, joten tämä pitää base64-datan varmasti workerin
 * KUVA_MAX_BASE64_PITUUS-rajan alla marginaalilla.
 */
export const KUVA_MAX_TAVUA_PAKATTUNA = 2_800_000;

export const SALLITUT_KUVAPAATTEET = ["jpg", "jpeg", "png", "webp", "svg"] as const;
export type KuvaPaate = (typeof SALLITUT_KUVAPAATTEET)[number];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_NIMI_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID_NUMERO_PATTERN = /^[0-9]+$/;

export interface UusiKatkoPyynto {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: {
    tiedostopaate: KuvaPaate;
    data: string;
  };
}

export function validoiId(id: string): string | null {
  const siisti = id.trim();
  if (siisti.length === 0) return "id on pakollinen";
  if (siisti.length > ID_MAX_PITUUS) return `id saa olla enintään ${ID_MAX_PITUUS} merkkiä`;
  if (!ID_PATTERN.test(siisti)) {
    return "id saa sisältää vain pieniä kirjaimia, numeroita ja väliviivoja (esim. lammin-honka)";
  }
  return null;
}

/**
 * Kätkön id rakennetaan kahdesta lomakekentästä: etsinnässä käytettävä nimi
 * (id:n tekstiosa, ks. features/paikat/alueet.ts:n paikanTunniste) ja sen
 * sisällä yksilöivä juokseva numero. Näin id on aina oikeassa muodossa eikä
 * admin voi vahingossa kirjoittaa sitä ilman numero-osaa.
 */
export function validoiIdNimi(nimi: string): string | null {
  const siisti = nimi.trim();
  if (siisti.length === 0) return "nimi on pakollinen";
  if (!ID_NIMI_PATTERN.test(siisti)) {
    return "nimi saa sisältää vain pieniä kirjaimia, numeroita ja väliviivoja (esim. neittava)";
  }
  return null;
}

export function validoiIdNumero(numero: string): string | null {
  const siisti = numero.trim();
  if (siisti.length === 0) return "numero on pakollinen";
  if (!ID_NUMERO_PATTERN.test(siisti)) return "numero saa sisältää vain numeroita";
  return null;
}

export function rakennaId(nimi: string, numero: string): string {
  return `${nimi.trim()}-${numero.trim()}`;
}

export function validoiAlue(alue: string): string | null {
  const siisti = alue.trim();
  if (siisti.length === 0) return "alue on pakollinen";
  if (alue.length > ALUE_MAX_PITUUS) return `alue saa olla enintään ${ALUE_MAX_PITUUS} merkkiä`;
  return null;
}

export function validoiKuvaus(kuvaus: string): string | null {
  const siisti = kuvaus.trim();
  if (siisti.length === 0) return "kuvaus on pakollinen";
  if (kuvaus.length > KUVAUS_MAX_PITUUS) {
    return `kuvaus saa olla enintään ${KUVAUS_MAX_PITUUS} merkkiä`;
  }
  return null;
}

export function validoiLat(lat: number | null): string | null {
  if (lat === null || !Number.isFinite(lat)) return "lat on pakollinen";
  if (lat < -90 || lat > 90) return "lat täytyy olla välillä -90..90";
  return null;
}

export function validoiLng(lng: number | null): string | null {
  if (lng === null || !Number.isFinite(lng)) return "lng on pakollinen";
  if (lng < -180 || lng > 180) return "lng täytyy olla välillä -180..180";
  return null;
}

/** Päättelee kuvan tiedostopäätteen tiedostonimestä. Palauttaa null jos
 * päätettä ei tunnisteta tai se ei ole sallittu. */
export function paattelKuvaPaate(tiedostonimi: string): KuvaPaate | null {
  const osat = tiedostonimi.toLowerCase().split(".");
  if (osat.length < 2) return null;
  const paate = osat[osat.length - 1];
  return (SALLITUT_KUVAPAATTEET as readonly string[]).includes(paate)
    ? (paate as KuvaPaate)
    : null;
}

/** `pakollinen: false` sallii `null`:in (esim. muokkauslomake, jossa nykyinen kuva säilyy jos uutta ei valita). */
export function validoiKuvaTiedosto(tiedosto: File | null, pakollinen = true): string | null {
  if (!tiedosto) return pakollinen ? "kuva on pakollinen" : null;
  if (paattelKuvaPaate(tiedosto.name) === null) {
    return `Kuvan tiedostopääte täytyy olla yksi: ${SALLITUT_KUVAPAATTEET.join(", ")}`;
  }
  if (tiedosto.size > KUVA_MAX_TAVUA_ALKUPERAINEN) {
    return "Kuva on liian suuri (maks. n. 20 Mt). Kuva pakataan automaattisesti lähetettäessä.";
  }
  return null;
}

export interface AdminLomakeVirheet {
  idNimi?: string;
  idNumero?: string;
  alue?: string;
  kuvaus?: string;
  lat?: string;
  lng?: string;
  kuva?: string;
}

export interface AdminLomakeSyote {
  idNimi: string;
  idNumero: string;
  alue: string;
  kuvaus: string;
  lat: number | null;
  lng: number | null;
  kuvaTiedosto: File | null;
}

/** Validoi koko lomakkeen ja palauttaa kenttäkohtaiset virheet, jos joku
 * kenttä ei kelpaa. Tyhjä objekti tarkoittaa, että lomake on kelvollinen. */
export function validoiAdminLomake(syote: AdminLomakeSyote): AdminLomakeVirheet {
  const virheet: AdminLomakeVirheet = {};

  const idNimiVirhe = validoiIdNimi(syote.idNimi);
  if (idNimiVirhe) virheet.idNimi = idNimiVirhe;

  const idNumeroVirhe = validoiIdNumero(syote.idNumero);
  if (idNumeroVirhe) virheet.idNumero = idNumeroVirhe;

  if (!idNimiVirhe && !idNumeroVirhe) {
    const idVirhe = validoiId(rakennaId(syote.idNimi, syote.idNumero));
    if (idVirhe) virheet.idNimi = idVirhe;
  }

  const alueVirhe = validoiAlue(syote.alue);
  if (alueVirhe) virheet.alue = alueVirhe;

  const kuvausVirhe = validoiKuvaus(syote.kuvaus);
  if (kuvausVirhe) virheet.kuvaus = kuvausVirhe;

  const latVirhe = validoiLat(syote.lat);
  if (latVirhe) virheet.lat = latVirhe;

  const lngVirhe = validoiLng(syote.lng);
  if (lngVirhe) virheet.lng = lngVirhe;

  const kuvaVirhe = validoiKuvaTiedosto(syote.kuvaTiedosto);
  if (kuvaVirhe) virheet.kuva = kuvaVirhe;

  return virheet;
}

export interface MuokkausLomakeVirheet {
  alue?: string;
  kuvaus?: string;
  lat?: string;
  lng?: string;
  kuva?: string;
}

export interface MuokkausLomakeSyote {
  alue: string;
  kuvaus: string;
  lat: number | null;
  lng: number | null;
  kuvaTiedosto: File | null;
}

/** Validoi olemassa olevan kätkön muokkauslomakkeen. Kuva on valinnainen — nykyinen kuva säilyy, jos uutta ei valita. */
export function validoiMuokkausLomake(syote: MuokkausLomakeSyote): MuokkausLomakeVirheet {
  const virheet: MuokkausLomakeVirheet = {};

  const alueVirhe = validoiAlue(syote.alue);
  if (alueVirhe) virheet.alue = alueVirhe;

  const kuvausVirhe = validoiKuvaus(syote.kuvaus);
  if (kuvausVirhe) virheet.kuvaus = kuvausVirhe;

  const latVirhe = validoiLat(syote.lat);
  if (latVirhe) virheet.lat = latVirhe;

  const lngVirhe = validoiLng(syote.lng);
  if (lngVirhe) virheet.lng = lngVirhe;

  const kuvaVirhe = validoiKuvaTiedosto(syote.kuvaTiedosto, false);
  if (kuvaVirhe) virheet.kuva = kuvaVirhe;

  return virheet;
}
