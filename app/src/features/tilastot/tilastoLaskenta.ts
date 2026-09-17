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

export interface OmaLoytoRivi {
  paikkaId: string;
  alue: string;
  kuvaus: string;
  aika: string;
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
      };
    })
    .sort((a, b) => b.aika.localeCompare(a.aika));
}
