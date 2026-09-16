import type { Paikka } from "../paikat/types";
import { paikanTunniste } from "../paikat/alueet";
import { etaisyysMetreina, suuntimaAsteina } from "./distance";
import { ALUE_AVAUTUU_METREINA } from "./kynnykset";

export interface LahellaOlevaAlue {
  alue: string;
  etaisyysMetreina: number;
  /** Suuntima käyttäjän sijainnista kohti lähintä kätköä, asteina (0-360, 0 = pohjoinen). */
  suuntimaAsteina: number;
}

/**
 * Etsii lähimmän ALUE_AVAUTUU_METREINA-säteellä olevan kätkön alueen, jotta
 * etusivu voi vihjata siitä ilman että käyttäjän tarvitsee tietää tai
 * kirjoittaa alueen nimeä. Ei paljasta kätkön sisältöä.
 */
export function etsiLaheisinAlue(
  paikat: Paikka[],
  sijainti: { lat: number; lng: number } | null,
): LahellaOlevaAlue | null {
  if (!sijainti) return null;

  let lahin: LahellaOlevaAlue | null = null;
  for (const paikka of paikat) {
    const etaisyys = etaisyysMetreina(sijainti, paikka);
    if (etaisyys <= ALUE_AVAUTUU_METREINA && (!lahin || etaisyys < lahin.etaisyysMetreina)) {
      lahin = {
        alue: paikanTunniste(paikka.id),
        etaisyysMetreina: etaisyys,
        suuntimaAsteina: suuntimaAsteina(sijainti, paikka),
      };
    }
  }
  return lahin;
}
