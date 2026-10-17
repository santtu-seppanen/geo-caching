import type { Paikka } from "../paikat/types";
import { AJASTETTU_HAKU_MS, nykyinenKohde, type Pelimoodi } from "./pelimoodit";

/**
 * Etsintä päättyy ehdottomasti tämän ajan kuluttua aloituksesta. Sama
 * takaraja on workerissa (ETSINTA_MAX_MS, ks. worker/src/validointi.ts),
 * joka hylkää löydön, jonka ilmoitettu etsintäaika ylittää sen.
 */
export const ETSINTA_MAX_MS = 3 * 60 * 60_000;

/** Onko etsintä aloitettu eikä takaraja ole vielä täynnä. */
export function etsintaKaynnissa(etsintaAlkoi: number | null, nyt: number): boolean {
  return etsintaAlkoi !== null && nyt - etsintaAlkoi < ETSINTA_MAX_MS;
}

export interface Eteneminen {
  /**
   * Nykyinen etsittävä kätkö järjestysmoodeissa. null vapaassa moodissa,
   * kun kaikki on käyty läpi, tai ajastetussa haussa ennen aloitusta.
   */
  kohde: Paikka | null;
  /**
   * Milloin nykyisen kohteen vuoro alkoi (vihjeiden ja ajastetun haun
   * ajastin) — edellisen kohteen löytö tai aikaraja, ensimmäisellä
   * kohteella etsinnän aloitus. null jos etsintää ei ole aloitettu.
   */
  vuoroAlkoi: number | null;
  /** Ajastetussa haussa kätköt, joiden aika loppui ennen löytöä. */
  ohitetutIdt: ReadonlySet<string>;
}

/**
 * Etsinnän tila johdettuna pelkästä aloitushetkestä ja pelaajan omista
 * löytöajoista — ei omaa tallennettua tilaa per kätkö, joten aika kuluu
 * myös sovelluksen ollessa kiinni ja uusi aloitus nollaa kaiken.
 *
 * Kätköt käydään läpi luontijärjestyksessä. Ennen vuoron alkua löydetyt
 * (esim. ennen tätä etsintää) ohitetaan. Ajastetussa haussa vuoro päättyy
 * AJASTETTU_HAKU_MS jälkeen, jolloin kätkö ohitetaan ja seuraavan vuoro
 * alkaa siitä hetkestä.
 */
export function etsinnanEteneminen(
  moodi: Pelimoodi,
  paikat: Paikka[],
  omatLoytoajat: ReadonlyMap<string, number>,
  etsintaAlkoi: number | null,
  nyt: number,
): Eteneminen {
  const ohitetutIdt = new Set<string>();

  if (moodi === "vapaa") return { kohde: null, vuoroAlkoi: etsintaAlkoi, ohitetutIdt };
  if (etsintaAlkoi === null) {
    // Ajastetussa haussa mitään ei näytetä ennen aloitusta, muissa
    // järjestysmoodeissa kohde näkyy mutta vihjeet eivät avaudu.
    const kohde = moodi === "ajastettu" ? null : nykyinenKohde(paikat, new Set(omatLoytoajat.keys()));
    return { kohde, vuoroAlkoi: null, ohitetutIdt };
  }

  let vuoroAlkoi = etsintaAlkoi;
  for (const paikka of paikat) {
    const loydetty = omatLoytoajat.get(paikka.id);
    if (loydetty !== undefined && loydetty < vuoroAlkoi) continue;

    const loppuu = moodi === "ajastettu" ? vuoroAlkoi + AJASTETTU_HAKU_MS : Infinity;
    if (loydetty !== undefined && loydetty < loppuu) {
      vuoroAlkoi = loydetty;
      continue;
    }
    if (nyt < loppuu) return { kohde: paikka, vuoroAlkoi, ohitetutIdt };

    // Aika loppui. Myöhemmin (100 m säännöllä) löydetty ei ole ohitettu.
    if (loydetty === undefined) ohitetutIdt.add(paikka.id);
    vuoroAlkoi = loppuu;
  }

  return { kohde: null, vuoroAlkoi: null, ohitetutIdt };
}

/**
 * Löytöajastimen alku: pelaajan edellinen löytö tämän etsinnän aikana tai
 * etsinnän aloitus. Mikä tahansa löytö nollaa ajastimen, joten löydölle
 * tallennettava kesto on aina "edellisestä löydöstä tai aloituksesta".
 */
export function loytoajastimenAlku(
  omatLoytoajat: ReadonlyMap<string, number>,
  etsintaAlkoi: number | null,
): number | null {
  if (etsintaAlkoi === null) return null;
  return Math.max(etsintaAlkoi, ...omatLoytoajat.values());
}
