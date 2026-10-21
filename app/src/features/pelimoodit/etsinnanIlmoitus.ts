import { ETSINTA_MAX_MS } from "./etsinta";

/** Varoitus annetaan, kun etsintää on jäljellä tämän verran. */
export const VAROITUS_ENNEN_PAATTYMISTA_MS = 15 * 60_000;

export type EtsinnanIlmoitus = "varoitus" | "paattyi";

/**
 * Pitääkö etsinnästä ilmoittaa: palauttaa arvon vain, kun raja ylitetään
 * edellisen tarkistuksen (`edellinenNyt`) ja nykyhetken välillä, joten sama
 * ilmoitus ei toistu. Jos molemmat rajat ylittyvät kerralla (sovellus oli
 * taustalla), ilmoitetaan vain päättymisestä.
 */
export function etsinnanIlmoitus(
  etsintaAlkoi: number,
  edellinenNyt: number,
  nyt: number,
): EtsinnanIlmoitus | null {
  const loppu = etsintaAlkoi + ETSINTA_MAX_MS;
  const varoitusRaja = loppu - VAROITUS_ENNEN_PAATTYMISTA_MS;

  if (edellinenNyt < loppu && nyt >= loppu) return "paattyi";
  if (edellinenNyt < varoitusRaja && nyt >= varoitusRaja && nyt < loppu) return "varoitus";
  return null;
}

export const ETSINNAN_ILMOITUKSEN_TEKSTI: Record<EtsinnanIlmoitus, (alue: string) => string> = {
  varoitus: (alue) => `Etsintää jäljellä 15 min (${alue}) — kirjaa löytösi ajoissa!`,
  paattyi: (alue) => `Etsintä päättyi (${alue}). Aloita uusi etsintä jatkaaksesi.`,
};
