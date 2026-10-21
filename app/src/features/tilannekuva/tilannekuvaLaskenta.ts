import { normalisoiAlueNimi, yhdistaSamannimiset, type Alue } from "../paikat/alueet";
import type { Loyto, Paikka } from "../paikat/types";
import { ETSINTA_MAX_MS } from "../pelimoodit/etsinta";
import type { KaynnissaOlevaEtsinta } from "../pelimoodit/etsinnatApi";
import { mitalitYhdelleKatkolle, type Mitali } from "../tilastot/tilastoLaskenta";

/**
 * Tilannekuvan alue valitaan vain käynnissä olevien etsintöjen alueista:
 * valittu avain jos sillä on yhä etsintä menossa, muuten alue, jolla on
 * eniten etsintöjä (tasatilanteessa tuorein aloitus). null jos kukaan ei
 * etsi — alueita, joilla ei ole etsintää, ei näytetä.
 */
export function valitseAlue(
  alueet: Alue[],
  valittuAvain: string | null,
  etsinnat: KaynnissaOlevaEtsinta[],
): Alue | null {
  const maarat = new Map<string, { maara: number; tuorein: string }>();
  for (const etsinta of etsinnat) {
    if (!yhdistaSamannimiset(alueet, etsinta.alueAvain)) continue;
    const aiempi = maarat.get(etsinta.alueAvain);
    maarat.set(etsinta.alueAvain, {
      maara: (aiempi?.maara ?? 0) + 1,
      tuorein: aiempi && aiempi.tuorein > etsinta.alkoi ? aiempi.tuorein : etsinta.alkoi,
    });
  }
  if (valittuAvain && maarat.has(valittuAvain)) return yhdistaSamannimiset(alueet, valittuAvain);

  const paras = [...maarat.entries()].sort(
    ([, a], [, b]) => b.maara - a.maara || b.tuorein.localeCompare(a.tuorein),
  )[0];
  return paras ? yhdistaSamannimiset(alueet, paras[0]) : null;
}

/** Etsintärivit alueittain listan valintaa varten (alueet ensimmäisen rivin järjestyksessä). */
export function ryhmitteleAlueittain(rivit: EtsintaRivi[]): { alueAvain: string; alueNimi: string; rivit: EtsintaRivi[] }[] {
  const ryhmat = new Map<string, { alueAvain: string; alueNimi: string; rivit: EtsintaRivi[] }>();
  for (const rivi of rivit) {
    const ryhma = ryhmat.get(rivi.alueAvain) ?? { alueAvain: rivi.alueAvain, alueNimi: rivi.alueNimi, rivit: [] };
    ryhma.rivit.push(rivi);
    ryhmat.set(rivi.alueAvain, ryhma);
  }
  return [...ryhmat.values()];
}

export interface EtsintaRivi {
  /** Näytettävä alueen nimi, tai avain jos alue on poistettu. */
  alueNimi: string;
  alueAvain: string;
  nimi: string | null;
  kulunutMs: number;
  jaljellaMs: number;
  /** Pelaajan löydöt alueella aloituksen jälkeen (vain jos nimimerkki tiedossa). */
  loydetty: number | null;
  yhteensa: number;
}

/** Käynnissä olevat etsinnät näytettävinä riveinä, vanhin ensin; takarajan ylittäneet pois. */
export function etsintaRivit(
  etsinnat: KaynnissaOlevaEtsinta[],
  alueet: Alue[],
  loydot: Loyto[],
  nyt: number,
): EtsintaRivi[] {
  const alueetAvaimittain = new Map(alueet.map((alue) => [normalisoiAlueNimi(alue.nimi), alue]));

  return etsinnat
    .map((etsinta) => {
      const alue = alueetAvaimittain.get(etsinta.alueAvain);
      const alkoi = Date.parse(etsinta.alkoi);
      const alueenIdt = new Set(alue?.paikat.map((p) => p.id) ?? []);
      const nimi = etsinta.nimi?.trim().toLowerCase();
      const loydetyt = nimi
        ? new Set(
            loydot
              .filter(
                (l) =>
                  alueenIdt.has(l.paikkaId) && l.nimi.trim().toLowerCase() === nimi && Date.parse(l.aika) >= alkoi,
              )
              .map((l) => l.paikkaId),
          ).size
        : null;
      return {
        alueNimi: alue?.nimi ?? etsinta.alueAvain,
        alueAvain: etsinta.alueAvain,
        nimi: etsinta.nimi,
        kulunutMs: Math.max(0, nyt - alkoi),
        jaljellaMs: alkoi + ETSINTA_MAX_MS - nyt,
        loydetty: loydetyt,
        yhteensa: alueenIdt.size,
      };
    })
    .filter((rivi) => rivi.jaljellaMs > 0)
    .sort((a, b) => b.kulunutMs - a.kulunutMs);
}

export interface KatkoRivi {
  paikka: Paikka;
  /** Löytäjät löytöjärjestyksessä; kolmella ensimmäisellä mitali. */
  loytajat: { nimi: string; mitali: Mitali | null }[];
}

export function katkoRivit(alue: Alue, loydot: Loyto[]): KatkoRivi[] {
  return alue.paikat.map((paikka) => {
    const katkonLoydot = loydot
      .filter((l) => l.paikkaId === paikka.id)
      .sort((a, b) => a.aika.localeCompare(b.aika));
    const mitalit = mitalitYhdelleKatkolle(katkonLoydot);
    return {
      paikka,
      loytajat: katkonLoydot.map((l) => ({ nimi: l.nimi, mitali: mitalit.get(l.nimi) ?? null })),
    };
  });
}

/** "1:05:09" tai "5:09". */
export function muotoileKesto(ms: number): string {
  const sekunnit = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sekunnit / 3600);
  const m = Math.floor((sekunnit % 3600) / 60);
  const s = sekunnit % 60;
  const mmss = `${String(m).padStart(h > 0 ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}
