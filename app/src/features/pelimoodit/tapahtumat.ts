import type { Pelimoodi } from "./pelimoodit";
import { VIHJE_TASOT } from "./vihjeet";

/** Pelin tila siltä osin kuin se aiheuttaa kuplaviestejä (vihjeen avautuminen, kätkön ohitus). */
export interface TapahtumaTila {
  moodi: Pelimoodi;
  /** Vihjeajastimen alku (vuoron alku), null jos etsintää ei ole aloitettu. */
  vuoroAlkoi: number | null;
  avautuneitaVihjeita: number;
  ohitettuja: number;
}

/**
 * Kuplaviesti, kun tila muuttuu edellisestä tilasta: uusi vihje avautui tai
 * ajastettu kätkö ohitettiin. null kun mitään ei tapahtunut — myös silloin,
 * kun etsintä aloitetaan alusta (laskurit palaavat nollaan eivätkä kasva).
 */
export function pelitapahtuma(edellinen: TapahtumaTila | null, nykyinen: TapahtumaTila): string | null {
  if (!edellinen || edellinen.moodi !== nykyinen.moodi) return null;

  if (
    nykyinen.moodi === "vihjeet" &&
    edellinen.vuoroAlkoi !== null &&
    edellinen.vuoroAlkoi === nykyinen.vuoroAlkoi &&
    nykyinen.avautuneitaVihjeita > edellinen.avautuneitaVihjeita
  ) {
    return nykyinen.avautuneitaVihjeita >= VIHJE_TASOT.length
      ? "Viimeinen vihje! Kätkö on aivan pienimmässä ympyrässä."
      : "Uusi vihje! Ympyrä kutistui.";
  }

  if (nykyinen.moodi === "ajastettu" && nykyinen.ohitettuja > edellinen.ohitettuja) {
    return "Aika loppui — kätkö ohitettu!";
  }

  return null;
}
