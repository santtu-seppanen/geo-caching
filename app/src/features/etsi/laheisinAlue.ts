import type { Paikka } from "../paikat/types";
import { paikanTunniste } from "../paikat/alueet";
import { etaisyysMetreina, suuntimaAsteina } from "./distance";
import { ALUE_AVAUTUU_METREINA } from "./kynnykset";

export interface LahellaOlevaAlue {
  /** Id:n tekstiosasta johdettu tunniste — käytetään navigointiin (ks. onValitseAlue), vain a-z0-9-. */
  alue: string;
  /** Kätkön oman `alue`-kentän ihmisluettava nimi (voi sisältää ääkkösiä), näytetään käyttäjälle. */
  nimi: string;
  etaisyysMetreina: number;
  /** Suuntima käyttäjän sijainnista kohti lähintä kätköä, asteina (0-360, 0 = pohjoinen). */
  suuntimaAsteina: number;
  /** Onko käyttäjä tarpeeksi lähellä avatakseen alueen kartan (ALUE_AVAUTUU_METREINA-säteellä). */
  avautuuKartalle: boolean;
}

/**
 * Etsii käyttäjää lähimmän kätkön alueen, jotta etusivu voi näyttää sen
 * ilman että käyttäjän tarvitsee tietää tai kirjoittaa alueen nimeä.
 * Alue näytetään aina kun sijainti tunnetaan, mutta sen kartan voi avata
 * (avautuuKartalle) vasta ALUE_AVAUTUU_METREINA-säteellä — kauempaa näkyy
 * vain alueen nimi, etäisyys ja suunta, ei kätkön sisältöä.
 */
export function etsiLaheisinAlue(
  paikat: Paikka[],
  sijainti: { lat: number; lng: number } | null,
): LahellaOlevaAlue | null {
  if (!sijainti) return null;

  let lahin: LahellaOlevaAlue | null = null;
  for (const paikka of paikat) {
    if (paikka.piilotaLahimmasta) continue;

    const etaisyys = etaisyysMetreina(sijainti, paikka);
    if (!lahin || etaisyys < lahin.etaisyysMetreina) {
      lahin = {
        alue: paikanTunniste(paikka.id),
        nimi: paikka.alue,
        etaisyysMetreina: etaisyys,
        suuntimaAsteina: suuntimaAsteina(sijainti, paikka),
        avautuuKartalle: etaisyys <= ALUE_AVAUTUU_METREINA,
      };
    }
  }
  return lahin;
}
