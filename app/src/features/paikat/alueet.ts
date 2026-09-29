import type { Paikka } from "./types";

export interface Alue {
  /** Id:n tekstiosasta johdettu tunniste — ryhmittelyn ja hakukentän avain, vain a-z0-9-. */
  alue: string;
  /** Kätkön oman `alue`-kentän ihmisluettava nimi (voi sisältää ääkkösiä), näytetään käyttäjälle. */
  nimi: string;
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
      nimi: alueenPaikat[0].alue,
      keskipiste: laskeKeskipiste(alueenPaikat),
      paikat: alueenPaikat,
    };
  });
}

/**
 * Seuraava vapaa juokseva numero annetulla tunnisteella — admin-lomake
 * päättelee sen automaattisesti alueen olemassa olevista kätköistä, ettei
 * admin voi vahingossa antaa jo käytössä olevaa id:tä.
 */
export function seuraavaVapaaNumero(paikat: Paikka[], tunniste: string): number {
  let suurin = 0;
  for (const paikka of paikat) {
    if (paikanTunniste(paikka.id) !== tunniste) continue;
    const numero = /-(\d+)$/.exec(paikka.id);
    if (numero) suurin = Math.max(suurin, Number(numero[1]));
  }
  return suurin + 1;
}

/**
 * Normalisoi alueen näytettävän nimen kirjainkoosta ja ääkkösten
 * kirjoitusasusta riippumattomaksi vertailua varten (esim. "neittävä" ==
 * "Neittävä" == "neittava").
 */
export function normalisoiAlueNimi(teksti: string): string {
  return teksti
    .trim()
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/å/g, "a");
}

/**
 * Yhdistää kaikki id:n tekstiosan perusteella muodostetut alueryhmät, joiden
 * näytettävä nimi täsmää annettuun nimeen. Yksi näytettävä alue-nimi voi
 * jakautua usealle eri id-tunnisteelle, jos vanhaan kätköön jäänyt
 * kirjoitusvirhe id:ssä on korjattu vain sen `alue`-kenttään — id on
 * muuttumaton R2/D1-avain eikä admin voi enää muokata sitä lomakkeella (ks.
 * CLAUDE.md). Etusivun haku ja lähimmän alueen valinta toimivat näytettävän
 * nimen perusteella, joten näiden ryhmien kätköt täytyy näyttää samalla
 * kartalla eikä vain ensimmäisenä löytyneen ryhmän kätköjä.
 */
export function yhdistaSamannimiset(alueet: Alue[], nimi: string): Alue | null {
  const kohde = normalisoiAlueNimi(nimi);
  const osuvat = alueet.filter((alue) => normalisoiAlueNimi(alue.nimi) === kohde);
  if (osuvat.length === 0) return null;

  const paikat = osuvat.flatMap((alue) => alue.paikat);
  return {
    alue: osuvat[0].alue,
    nimi: osuvat[0].nimi,
    keskipiste: laskeKeskipiste(paikat),
    paikat,
  };
}

/** Montako alueen kätköistä on löydetty. */
export function alueenLoydettyjenMaara(alue: Alue, loydetytIdt: ReadonlySet<string>): number {
  return alue.paikat.filter((paikka) => loydetytIdt.has(paikka.id)).length;
}

/** Onko alueen jokainen kätkö löydetty. */
export function alueLoydettyKokonaan(alue: Alue, loydetytIdt: ReadonlySet<string>): boolean {
  return alue.paikat.every((paikka) => loydetytIdt.has(paikka.id));
}

export function laskeKeskipiste(paikat: Paikka[]): { lat: number; lng: number } {
  const summa = paikat.reduce(
    (acc, paikka) => ({ lat: acc.lat + paikka.lat, lng: acc.lng + paikka.lng }),
    { lat: 0, lng: 0 },
  );

  return { lat: summa.lat / paikat.length, lng: summa.lng / paikat.length };
}
