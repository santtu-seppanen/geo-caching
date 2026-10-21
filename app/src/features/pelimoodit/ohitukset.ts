import type { Alue } from "../paikat/alueet";
import { normalisoiAlueNimi } from "../paikat/alueet";
import type { Loyto } from "../paikat/types";
import { etsinnanEteneminen, etsintaKaynnissa } from "./etsinta";
import { alueenPelimoodi, type AlueidenPelimoodit } from "./pelimoodiApi";

export interface AlueenOhitukset {
  alue: string;
  /** Ajastetussa haussa ohitetut (aika loppui ennen löytöä) kätköt nykyisessä etsinnässä. */
  ohitettu: number;
  yhteensa: number;
}

/**
 * Ohitettujen kätköjen määrä alueittain, vain ajastetun haun alueilla joilla
 * etsintä on aloitettu. Ei tallenneta mihinkään: johdetaan samoista tiedoista
 * kuin aluesivun eteneminen (aloitushetki + pelaajan omat löytöajat), joten
 * uusi aloitus nollaa luvun.
 */
export function laskeOhitukset(
  alueet: Alue[],
  pelimoodit: AlueidenPelimoodit,
  loydot: Loyto[],
  pelaajanNimi: string,
  haeAloitus: (alueAvain: string) => number | null,
  nyt: number,
): AlueenOhitukset[] {
  const nimi = pelaajanNimi.trim().toLowerCase();
  const omat = nimi ? loydot.filter((l) => l.nimi.trim().toLowerCase() === nimi) : [];

  const tulos: AlueenOhitukset[] = [];
  for (const alue of alueet) {
    if (alueenPelimoodi(pelimoodit, alue.nimi) !== "ajastettu") continue;
    const alkoi = haeAloitus(normalisoiAlueNimi(alue.nimi));
    // Takarajan jälkeen etsintä on kuin aloittamaton (ks. Aluesivu): ohituksia ei lasketa.
    if (alkoi === null || !etsintaKaynnissa(alkoi, nyt)) continue;

    const ajat = new Map<string, number>();
    for (const loyto of omat) {
      const aika = Date.parse(loyto.aika);
      const aiempi = ajat.get(loyto.paikkaId);
      if (aiempi === undefined || aika < aiempi) ajat.set(loyto.paikkaId, aika);
    }

    const { ohitetutIdt } = etsinnanEteneminen("ajastettu", alue.paikat, ajat, alkoi, nyt);
    tulos.push({ alue: alue.nimi, ohitettu: ohitetutIdt.size, yhteensa: alue.paikat.length });
  }
  return tulos;
}

