import type { Paikka } from "../paikat/types";
import { etaisyysMetreina } from "../etsi/distance";
import { KATKO_AVAUTUU_METREINA } from "../etsi/kynnykset";

/** Sama lista kuin workerin SALLITUT_PELIMOODIT (ks. worker/src/validointi.ts). */
export const PELIMOODIT = ["vapaa", "yksi-kerrallaan", "kolmiomittaus", "vihjeet"] as const;
export type Pelimoodi = (typeof PELIMOODIT)[number];

export const OLETUS_PELIMOODI: Pelimoodi = "vapaa";

export const PELIMOODIN_NIMI: Record<Pelimoodi, string> = {
  vapaa: "Vapaa etsintä",
  "yksi-kerrallaan": "Yksi kerrallaan",
  kolmiomittaus: "Kolmiomittaus",
  vihjeet: "Ajastetut vihjeet",
};

export const PELIMOODIN_KUVAUS: Record<Pelimoodi, string> = {
  vapaa: "Kaikki alueen kätköt näkyvät kartalla.",
  "yksi-kerrallaan": "Kartalla näkyy vain seuraava kätkö. Seuraava paljastuu, kun löydät edellisen.",
  kolmiomittaus:
    "Kätkö ei näy kartalla. Mittaa etäisyys kätköön eri paikoista — ympyröiden leikkauspisteessä se on.",
  vihjeet:
    "Kätkö ei näy kartalla. Saat rajatun määrän yhä tarkempia vihjeitä, ja niiden välissä pitää odottaa.",
};

export function onPelimoodi(arvo: unknown): arvo is Pelimoodi {
  return typeof arvo === "string" && (PELIMOODIT as readonly string[]).includes(arvo);
}

/** Moodit, joissa etsittävä kätkö on piilossa ja alueen kätköjä etsitään järjestyksessä yksi kerrallaan. */
export function etsitaankoYksiKerrallaan(moodi: Pelimoodi): boolean {
  return moodi !== "vapaa";
}

export function kohdePiilossa(moodi: Pelimoodi): boolean {
  return moodi === "kolmiomittaus" || moodi === "vihjeet";
}

/**
 * Seuraava etsittävä kätkö: alueen ensimmäinen (luontijärjestyksessä,
 * ks. haePaikat "ORDER BY rowid") kätkö, jota pelaaja ei ole itse vielä
 * löytänyt. null kun kaikki on löydetty.
 */
export function nykyinenKohde(paikat: Paikka[], omatLoydetytIdt: ReadonlySet<string>): Paikka | null {
  return paikat.find((paikka) => !omatLoydetytIdt.has(paikka.id)) ?? null;
}

/**
 * Kartalla näytettävät kätköt pelimoodin mukaan. Pelaajan itse löytämät
 * näkyvät aina, samoin mikä tahansa KATKO_AVAUTUU_METREINA-säteellä oleva
 * (muuten piilomoodeissa kätköä ei voisi avata, ja lähellä-hälytys
 * paljastaa sen joka tapauksessa).
 */
export function nakyvatPaikat(
  moodi: Pelimoodi,
  paikat: Paikka[],
  omatLoydetytIdt: ReadonlySet<string>,
  sijainti: { lat: number; lng: number } | null,
): Paikka[] {
  if (moodi === "vapaa") return paikat;

  const kohde = nykyinenKohde(paikat, omatLoydetytIdt);
  return paikat.filter(
    (paikka) =>
      omatLoydetytIdt.has(paikka.id) ||
      (moodi === "yksi-kerrallaan" && paikka === kohde) ||
      (sijainti !== null && etaisyysMetreina(sijainti, paikka) <= KATKO_AVAUTUU_METREINA),
  );
}
