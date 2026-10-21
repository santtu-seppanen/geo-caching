import { etsintaKaynnissa } from "./etsinta";
import type { KaynnissaOlevaEtsinta } from "./etsinnatApi";

export interface PalautettavaEtsinta {
  alueAvain: string;
  /** Aloitushetki (Date.now()-muodossa) palvelimen ilmoittamasta ajasta. */
  alkoi: number;
}

const siisti = (nimi: string) => nimi.trim().toLowerCase();

/**
 * Palvelimella käynnissä olevat etsinnät, jotka tämän laitteen pitää ottaa
 * käyttöön: samalla nimimerkillä (kirjainkoosta riippumatta) aloitetut,
 * joita laitteella ei ole tai joiden aloitus on laitteella vanhempi.
 * Samalle alueelle voi olla useita rivejä (eri laitteilta) — uusin voittaa,
 * koska uusi aloitus korvaa aina vanhan. Jo umpeutuneet ohitetaan.
 *
 * Etsinnän tila johdetaan pelkästä aloitushetkestä (ks. etsinta.ts), joten
 * pelkkä aloitus riittää: ajastimet, vihjeet ja takaraja seuraavat siitä.
 */
export function palautettavatEtsinnat(
  palvelimenEtsinnat: KaynnissaOlevaEtsinta[],
  nimi: string,
  paikallinenAloitus: (alueAvain: string) => number | null,
  nyt: number,
): PalautettavaEtsinta[] {
  if (!siisti(nimi)) return [];

  const uusimmat = new Map<string, number>();
  for (const etsinta of palvelimenEtsinnat) {
    if (!etsinta.nimi || siisti(etsinta.nimi) !== siisti(nimi)) continue;
    const alkoi = Date.parse(etsinta.alkoi);
    if (Number.isNaN(alkoi) || !etsintaKaynnissa(alkoi, nyt)) continue;
    if (alkoi > (uusimmat.get(etsinta.alueAvain) ?? 0)) uusimmat.set(etsinta.alueAvain, alkoi);
  }

  return [...uusimmat]
    .filter(([alueAvain, alkoi]) => (paikallinenAloitus(alueAvain) ?? 0) < alkoi)
    .map(([alueAvain, alkoi]) => ({ alueAvain, alkoi }));
}
