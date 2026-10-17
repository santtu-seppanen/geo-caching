import { etaisyysMetreina } from "../etsi/distance";

export interface VihjeTaso {
  /** Kuinka kauan etsinnän alusta vihje avautuu. */
  avautuuMs: number;
  /** Vihjeympyrän säde — kätkö on aina ympyrän sisällä, mutta ei keskellä. */
  sadeMetreina: number;
}

/** Rajattu määrä vihjeitä, ja niiden välissä pitää odottaa. */
export const VIHJE_TASOT: readonly VihjeTaso[] = [
  { avautuuMs: 0, sadeMetreina: 400 },
  { avautuuMs: 5 * 60_000, sadeMetreina: 200 },
  { avautuuMs: 10 * 60_000, sadeMetreina: 100 },
];

/** Kolmiomittauksessa mittausten väli, ettei etäisyyttä voi seurata reaaliajassa. */
export const MITTAUS_VALI_MS = 60_000;

/** Pyöristys, jottei yksi mittaus paljasta kätkön paikkaa metrin tarkkuudella. */
export const MITTAUS_TARKKUUS_METREINA = 10;

/** Montako vihjettä on avautunut hetkeen `nyt` mennessä. */
export function avautuneitaVihjeita(alkoi: number, nyt: number): number {
  return VIHJE_TASOT.filter((taso) => nyt - alkoi >= taso.avautuuMs).length;
}

/** Millisekunnit seuraavaan vihjeeseen, tai null jos kaikki on jo avautunut. */
export function seuraavaanVihjeeseenMs(alkoi: number, nyt: number): number | null {
  const seuraava = VIHJE_TASOT[avautuneitaVihjeita(alkoi, nyt)];
  return seuraava ? alkoi + seuraava.avautuuMs - nyt : null;
}

/** FNV-1a — deterministinen "satunnaisluku" 0..1, ettei ympyrä hypi uudelleenlatauksessa. */
function siemenluku(teksti: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < teksti.length; i++) {
    hash ^= teksti.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 0x100000000;
}

const METRIA_LEVEYSASTEELLA = 111_320;

/**
 * Vihjeympyrän keskipiste: siirretty kätköstä satunnaiseen suuntaan
 * korkeintaan 70 % säteestä, jotta kätkö on ympyrän sisällä mutta
 * keskipiste ei paljasta sitä.
 */
export function vihjeYmpyranKeskipiste(
  paikka: { id: string; lat: number; lng: number },
  tasoIndeksi: number,
): { lat: number; lng: number } {
  const { sadeMetreina } = VIHJE_TASOT[tasoIndeksi];
  const etaisyys = sadeMetreina * 0.7 * Math.sqrt(siemenluku(`${paikka.id}:${tasoIndeksi}:etaisyys`));
  const kulma = 2 * Math.PI * siemenluku(`${paikka.id}:${tasoIndeksi}:kulma`);

  return {
    lat: paikka.lat + (etaisyys * Math.cos(kulma)) / METRIA_LEVEYSASTEELLA,
    lng:
      paikka.lng +
      (etaisyys * Math.sin(kulma)) /
        (METRIA_LEVEYSASTEELLA * Math.cos((paikka.lat * Math.PI) / 180)),
  };
}

export function mitattuEtaisyys(
  sijainti: { lat: number; lng: number },
  paikka: { lat: number; lng: number },
): number {
  return (
    Math.round(etaisyysMetreina(sijainti, paikka) / MITTAUS_TARKKUUS_METREINA) *
    MITTAUS_TARKKUUS_METREINA
  );
}
