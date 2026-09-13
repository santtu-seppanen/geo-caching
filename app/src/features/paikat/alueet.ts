import type { Paikka } from "./types";

export interface Alue {
  alue: string;
  keskipiste: { lat: number; lng: number };
  paikat: Paikka[];
}

/**
 * Kätkön id on kaksiosainen, teksti + numero (esim. "neittava-1"), jotta
 * saman alueen kätköt voi löytää kirjoittamalla vain tekstiosan etusivun
 * hakukenttään ilman että alueiden nimiä listataan kenellekään näkyviin.
 * Jos id:ssä ei ole numero-osaa, koko id on tunniste (yksittäinen kätkö).
 */
export function paikanTunniste(id: string): string {
  const numerollinen = /^(.+)-\d+$/.exec(id);
  return numerollinen ? numerollinen[1] : id;
}

/**
 * Alueita ei säilytetä omana JSON-tiedostonaan — jokainen kätkö kertoo jo
 * itse, mihin alueeseen se kuuluu (id:n tekstiosa), joten alueiden lista ja
 * niiden keskipiste on turvallisinta johtaa paikkalistasta ajossa. Näin
 * data ei voi ajautua epäsynkkaan kahden tiedoston välillä.
 */
export function ryhmitteleAlueiksi(paikat: Paikka[]): Alue[] {
  const jarjestys: string[] = [];
  const ryhmat = new Map<string, Paikka[]>();

  for (const paikka of paikat) {
    const tunniste = paikanTunniste(paikka.id);
    const ryhma = ryhmat.get(tunniste);
    if (ryhma) {
      ryhma.push(paikka);
    } else {
      ryhmat.set(tunniste, [paikka]);
      jarjestys.push(tunniste);
    }
  }

  return jarjestys.map((alue) => {
    const alueenPaikat = ryhmat.get(alue)!;
    return {
      alue,
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
