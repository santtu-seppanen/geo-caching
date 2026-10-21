import type { Loyto, Paikka } from "../paikat/types";
import { normalisoiAlueNimi } from "../paikat/alueet";

export type MerkkiId = "alue-valloitettu" | "yokatkoilija" | "nopea-nappaus";

export interface Merkki {
  id: MerkkiId;
  nimi: string;
  emoji: string;
}

/** "Nopea nappaus": löytö tehty tämän ajan sisällä etsinnän aloituksesta tai edellisestä löydöstä. */
export const NOPEA_NAPPAUS_MAX_MS = 5 * 60 * 1000;

/** Yökätköilijä: löytöhetken paikallinen tunti on [00, 05). */
const YO_LOPPUU_TUNTI = 5;

const MERKIT: Record<MerkkiId, Merkki> = {
  "alue-valloitettu": { id: "alue-valloitettu", nimi: "Alue valloitettu", emoji: "🏴" },
  yokatkoilija: { id: "yokatkoilija", nimi: "Yökätköilijä", emoji: "🌙" },
  "nopea-nappaus": { id: "nopea-nappaus", nimi: "Nopea nappaus", emoji: "⚡" },
};

/**
 * Saavutusmerkit, jotka tämä yksi löytö ansaitsee. Pääteltävissä pelkästä
 * `paikat`+`loydot`-datasta, joten mitään ei tallenneta — merkit lasketaan
 * löydön hetkellä ja näytetään löytöanimaatiossa.
 *
 * `kaikkiLoydot` sisältää myös tämän löydön (kuten App:n yhdistetty lista).
 */
export function ansaitutMerkit(loyto: Loyto, paikat: Paikka[], kaikkiLoydot: Loyto[]): Merkki[] {
  const ansaitut: Merkki[] = [];

  const paikka = paikat.find((p) => p.id === loyto.paikkaId);
  if (paikka) {
    const alueenKatkot = paikat.filter(
      (p) => normalisoiAlueNimi(p.alue) === normalisoiAlueNimi(paikka.alue),
    );
    const nimi = loyto.nimi.toLowerCase();
    const omatIdt = new Set(
      [...kaikkiLoydot, loyto].filter((l) => l.nimi.toLowerCase() === nimi).map((l) => l.paikkaId),
    );
    // Vähintään kaksi kätköä: yhden kätkön "alue" ei ole valloitus.
    if (alueenKatkot.length >= 2 && alueenKatkot.every((p) => omatIdt.has(p.id))) {
      ansaitut.push(MERKIT["alue-valloitettu"]);
    }
  }

  const aika = new Date(loyto.aika);
  if (!Number.isNaN(aika.getTime()) && aika.getHours() < YO_LOPPUU_TUNTI) {
    ansaitut.push(MERKIT.yokatkoilija);
  }

  if (loyto.kestoMs != null && loyto.kestoMs <= NOPEA_NAPPAUS_MAX_MS) {
    ansaitut.push(MERKIT["nopea-nappaus"]);
  }

  return ansaitut;
}
