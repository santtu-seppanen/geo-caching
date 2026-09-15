import type { Loyto, Paikka } from "./types";
import { paikanTunniste } from "./alueet";

function loydonAvain(loyto: Loyto): string {
  return `${loyto.paikkaId}|${loyto.nimi}|${loyto.aika}`;
}

/**
 * Palauttaa löydöt, jotka ovat uudessa listassa mutta eivät vanhassa —
 * esim. muiden pelaajien löydöt jotka ilmestyivät /loydot-pollauksen
 * väliin.
 */
export function uudetLoydot(vanhat: Loyto[], uudet: Loyto[]): Loyto[] {
  const vanhatAvaimet = new Set(vanhat.map(loydonAvain));
  return uudet.filter((loyto) => !vanhatAvaimet.has(loydonAvain(loyto)));
}

/** Muodostaa ilmoituksen tekstin, kun toinen pelaaja löytää kätkön. */
export function muodostaLoytoIlmoitus(
  loyto: Loyto,
  paikka: Paikka | undefined,
): { otsikko: string; viesti: string } {
  const alue = paikka ? paikanTunniste(paikka.id) : null;
  const alueTeksti = alue ? ` alueella ${alue.charAt(0).toUpperCase() + alue.slice(1)}` : "";

  return {
    otsikko: "Kätkö löytyi! Kiirehdi paikalle 🍾",
    viesti: `${loyto.nimi} löysi juuri kätkön${alueTeksti}. Toiset juovat jo kätköllä — ehditkö mukaan?`,
  };
}
