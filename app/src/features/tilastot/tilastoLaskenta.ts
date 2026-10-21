import type { Loyto, Paikka } from "../paikat/types";

/**
 * Yhdistää palvelimelta haetut löydöt ja omat optimistisesti lisätyt
 * löydöt yhdeksi listaksi ilman tuplia. Worker generoi `aika`-kentän
 * palvelinpuolella, joten oma optimistinen löytö ei koskaan täsmää
 * palvelimen versioon `aika`:n perusteella — tunniste on siksi
 * paikkaId+nimi, ja palvelimen versiota suositaan kun molemmat löytyvät.
 */
export function yhdistaLoydot(loydot: Loyto[], omatLoydot: Loyto[]): Loyto[] {
  const avaimet = new Set(loydot.map((loyto) => `${loyto.paikkaId}|${loyto.nimi}`));
  const paikallisetJotkaEiOleViela = omatLoydot.filter(
    (loyto) => !avaimet.has(`${loyto.paikkaId}|${loyto.nimi}`),
  );
  return [...loydot, ...paikallisetJotkaEiOleViela];
}

export interface LoytajaRivi {
  nimi: string;
  maara: number;
}

/** Löytöjen määrä nimimerkkiä kohden, eniten löytäneet ensin. */
export function laskePistetaulu(loydot: Loyto[]): LoytajaRivi[] {
  const maarat = new Map<string, number>();
  for (const loyto of loydot) {
    maarat.set(loyto.nimi, (maarat.get(loyto.nimi) ?? 0) + 1);
  }

  return [...maarat.entries()]
    .map(([nimi, maara]) => ({ nimi, maara }))
    .sort((a, b) => b.maara - a.maara || a.nimi.localeCompare(b.nimi, "fi"));
}

export type Mitali = "kulta" | "hopea" | "pronssi";

export const MITALI_EMOJI: Record<Mitali, string> = {
  kulta: "🥇",
  hopea: "🥈",
  pronssi: "🥉",
};

const MITALIJARJESTYS: readonly Mitali[] = ["kulta", "hopea", "pronssi"];

/**
 * Yhden kätkön löytäjien mitalit (kolme ensimmäistä löytöjärjestyksessä,
 * pääteltynä aika-kentästä) nimimerkin mukaan haettavaksi. Kutsujan täytyy
 * antaa jo valmiiksi vain tätä yhtä kätköä koskevat löydöt.
 */
export function mitalitYhdelleKatkolle(katkonLoydot: Loyto[]): Map<string, Mitali> {
  const jarjestyksessa = [...katkonLoydot].sort((a, b) => a.aika.localeCompare(b.aika));
  const kartta = new Map<string, Mitali>();
  jarjestyksessa.slice(0, MITALIJARJESTYS.length).forEach((loyto, indeksi) => {
    kartta.set(loyto.nimi, MITALIJARJESTYS[indeksi]);
  });
  return kartta;
}

export interface MitaliMaarat {
  kulta: number;
  hopea: number;
  pronssi: number;
}

/** Mitalien määrä nimimerkkiä kohden, laskettuna yli kaikkien kätköjen. */
export function laskeMitaliMaaratNimittain(loydot: Loyto[]): Map<string, MitaliMaarat> {
  const ryhmatPaikanMukaan = new Map<string, Loyto[]>();
  for (const loyto of loydot) {
    const lista = ryhmatPaikanMukaan.get(loyto.paikkaId);
    if (lista) lista.push(loyto);
    else ryhmatPaikanMukaan.set(loyto.paikkaId, [loyto]);
  }

  const maarat = new Map<string, MitaliMaarat>();
  for (const katkonLoydot of ryhmatPaikanMukaan.values()) {
    for (const [nimi, mitali] of mitalitYhdelleKatkolle(katkonLoydot)) {
      const nykyinen = maarat.get(nimi) ?? { kulta: 0, hopea: 0, pronssi: 0 };
      nykyinen[mitali] += 1;
      maarat.set(nimi, nykyinen);
    }
  }
  return maarat;
}

export interface OmaLoytoRivi {
  paikkaId: string;
  alue: string;
  kuvaus: string;
  aika: string;
  /** Löytöön kulunut aika (ks. Loyto.kestoMs), null jos ei tiedossa. */
  kestoMs: number | null;
}

/**
 * Annetun nimimerkin löydöt tuoreimmat ensin, yhdistettynä paikkatietoon.
 * Palauttaa tyhjän listan jos nimi on tyhjä (esim. laitteella ei ole vielä
 * merkitty yhtään löytöä).
 */
export function laskeOmatLoydot(loydot: Loyto[], paikat: Paikka[], nimi: string): OmaLoytoRivi[] {
  const siisti = nimi.trim();
  if (!siisti) return [];

  const paikatIdlla = new Map(paikat.map((paikka) => [paikka.id, paikka]));

  return loydot
    .filter((loyto) => loyto.nimi === siisti)
    .map((loyto) => {
      const paikka = paikatIdlla.get(loyto.paikkaId);
      return {
        paikkaId: loyto.paikkaId,
        alue: paikka?.alue ?? "Tuntematon alue",
        kuvaus: paikka?.kuvaus ?? "Tuntematon kätkö",
        aika: loyto.aika,
        kestoMs: loyto.kestoMs ?? null,
      };
    })
    .sort((a, b) => b.aika.localeCompare(a.aika));
}

/**
 * Alueen "mestarit": eniten alueen kätköjä löytäneet nimimerkit (useita jos
 * tasatilanne). Tyhjä lista jos alueella ei ole yhtään löytöä. Kutsujan
 * antamat löydöt voivat sisältää muidenkin alueiden löytöjä — ne suodatetaan
 * pois. Sama nimimerkki lasketaan kätkökohtaisesti kerran (tuplat ohitetaan).
 */
export function alueenMestarit(
  alueenPaikkaIdt: ReadonlySet<string>,
  loydot: Loyto[],
): { nimet: string[]; maara: number } {
  const kaytetyt = new Set<string>();
  const maarat = new Map<string, number>();
  for (const loyto of loydot) {
    if (!alueenPaikkaIdt.has(loyto.paikkaId)) continue;
    const avain = `${loyto.paikkaId}|${loyto.nimi.toLowerCase()}`;
    if (kaytetyt.has(avain)) continue;
    kaytetyt.add(avain);
    maarat.set(loyto.nimi, (maarat.get(loyto.nimi) ?? 0) + 1);
  }
  const maara = Math.max(0, ...maarat.values());
  if (maara === 0) return { nimet: [], maara: 0 };
  const nimet = [...maarat.entries()]
    .filter(([, m]) => m === maara)
    .map(([nimi]) => nimi)
    .sort((a, b) => a.localeCompare(b, "fi"));
  return { nimet, maara };
}
