export interface PullonKoko {
  ml: number;
  nimi: string;
}

/**
 * Yleisimmät viinapullokoot litraan asti — isompia (magnum, jeroboam...)
 * ei tueta, koska kätköissä ei käytetä niin suuria pulloja.
 */
export const PULLON_KOOT: PullonKoko[] = [
  { ml: 50, nimi: "Miniatyyri" },
  { ml: 200, nimi: "Puolituoppi" },
  { ml: 350, nimi: "Tuoppi" },
  { ml: 500, nimi: "Puolen litran pullo" },
  { ml: 700, nimi: "700 ml -pullo" },
  { ml: 750, nimi: "750 ml -pullo" },
  { ml: 1000, nimi: "Litran pullo" },
];

export function pullonKokoNimi(ml: number): string {
  return PULLON_KOOT.find((koko) => koko.ml === ml)?.nimi ?? `${ml} ml`;
}
