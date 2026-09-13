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
export const ALUE_VIHJE_MAX_PITUUS = 300;
export const KUVAUS_MAX_PITUUS = 500;

/** Raakatiedoston maks. koko tavuina. Base64 kasvattaa kokoa ~1,33x, joten
 * tämä pitää base64-datan varmasti workerin 2 000 000 merkin rajan alla. */
export const KUVA_MAX_TAVUA = 1_400_000;

export const SALLITUT_KUVAPAATTEET = ["jpg", "jpeg", "png", "webp", "svg"] as const;
export type KuvaPaate = (typeof SALLITUT_KUVAPAATTEET)[number];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface UusiKatkoPyynto {
  id: string;
  alue: string;
  alueVihje: string;
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

export function validoiAlue(alue: string): string | null {
  const siisti = alue.trim();
  if (siisti.length === 0) return "alue on pakollinen";
  if (alue.length > ALUE_MAX_PITUUS) return `alue saa olla enintään ${ALUE_MAX_PITUUS} merkkiä`;
  return null;
}

export function validoiAlueVihje(alueVihje: string): string | null {
  const siisti = alueVihje.trim();
  if (siisti.length === 0) return "alueVihje on pakollinen";
  if (alueVihje.length > ALUE_VIHJE_MAX_PITUUS) {
    return `alueVihje saa olla enintään ${ALUE_VIHJE_MAX_PITUUS} merkkiä`;
  }
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

export function validoiKuvaTiedosto(tiedosto: File | null): string | null {
  if (!tiedosto) return "kuva on pakollinen";
  if (paattelKuvaPaate(tiedosto.name) === null) {
    return `Kuvan tiedostopääte täytyy olla yksi: ${SALLITUT_KUVAPAATTEET.join(", ")}`;
  }
  if (tiedosto.size > KUVA_MAX_TAVUA) {
    return "Kuva on liian suuri, pienennä sitä ennen lähetystä (maks. n. 1,4 Mt).";
  }
  return null;
}

export interface AdminLomakeVirheet {
  id?: string;
  alue?: string;
  alueVihje?: string;
  kuvaus?: string;
  lat?: string;
  lng?: string;
  kuva?: string;
}

export interface AdminLomakeSyote {
  id: string;
  alue: string;
  alueVihje: string;
  kuvaus: string;
  lat: number | null;
  lng: number | null;
  kuvaTiedosto: File | null;
}

/** Validoi koko lomakkeen ja palauttaa kenttäkohtaiset virheet, jos joku
 * kenttä ei kelpaa. Tyhjä objekti tarkoittaa, että lomake on kelvollinen. */
export function validoiAdminLomake(syote: AdminLomakeSyote): AdminLomakeVirheet {
  const virheet: AdminLomakeVirheet = {};

  const idVirhe = validoiId(syote.id);
  if (idVirhe) virheet.id = idVirhe;

  const alueVirhe = validoiAlue(syote.alue);
  if (alueVirhe) virheet.alue = alueVirhe;

  const alueVihjeVirhe = validoiAlueVihje(syote.alueVihje);
  if (alueVihjeVirhe) virheet.alueVihje = alueVihjeVirhe;

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
