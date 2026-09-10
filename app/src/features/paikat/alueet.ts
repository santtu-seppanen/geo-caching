import type { Paikka } from "./types";

export interface Alue {
  alue: string;
  alueVihje: string;
  keskipiste: { lat: number; lng: number };
  paikat: Paikka[];
}

/**
 * Alueita ei säilytetä omana JSON-tiedostonaan — jokainen kätkö kertoo jo
 * itse, mihin alueeseen se kuuluu (`alue`-kenttä), joten alueiden lista ja
 * niiden keskipiste on turvallisinta johtaa `paikat.json`:sta ajossa. Näin
 * data ei voi ajautua epäsynkkaan kahden tiedoston välillä.
 */
export function ryhmitteleAlueiksi(paikat: Paikka[]): Alue[] {
  const jarjestys: string[] = [];
  const ryhmat = new Map<string, Paikka[]>();

  for (const paikka of paikat) {
    const ryhma = ryhmat.get(paikka.alue);
    if (ryhma) {
      ryhma.push(paikka);
    } else {
      ryhmat.set(paikka.alue, [paikka]);
      jarjestys.push(paikka.alue);
    }
  }

  return jarjestys.map((alue) => {
    const alueenPaikat = ryhmat.get(alue)!;
    return {
      alue,
      alueVihje: alueenPaikat[0].alueVihje,
      keskipiste: laskeKeskipiste(alueenPaikat),
      paikat: alueenPaikat,
    };
  });
}

export function laskeKeskipiste(paikat: Paikka[]): { lat: number; lng: number } {
  const summa = paikat.reduce(
    (acc, paikka) => ({ lat: acc.lat + paikka.lat, lng: acc.lng + paikka.lng }),
    { lat: 0, lng: 0 },
  );

  return { lat: summa.lat / paikat.length, lng: summa.lng / paikat.length };
}
