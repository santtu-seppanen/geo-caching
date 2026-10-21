/**
 * OpenStreetMapin vakiolaattapalvelun käyttö noudattaa OSMF:n laattapalvelun
 * käyttöehtoja (https://operations.osmfoundation.org/policies/tiles/):
 *  - näkyvä attribuutio (`LAATTA_ATTRIBUUTIO`) jokaisella kartalla;
 *  - ei `{s}`-alidomaineja, vaan `tile.openstreetmap.org` (a/b/c-nimet ovat vanhentuneita);
 *  - laattoja ei ladata etukäteen eikä joukolla: vain käyttäjän oikeasti
 *    katsomat laatat tallentuvat selaimen/service workerin välimuistiin
 *    (ks. `LAATTA_VALIMUISTI` ja vite.config.ts), ja välimuistin elinikä on
 *    enintään laattapalvelun oma vanhenemisaika;
 *  - selain lähettää oman Referer-otsikkonsa (sovellus ei kiellä sitä).
 */
export const LAATTA_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const LAATTA_ATTRIBUUTIO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Vakiolaattojen suurin zoom-taso; sen yli laattapalvelu ei tarjoa kuvaa. */
export const LAATTA_MAX_ZOOM = 19;

/**
 * Service workerin laattavälimuisti: vain on-demand (CacheFirst) eikä
 * esilatausta. 7 vrk vastaa laattapalvelun tavallista Cache-Control-aikaa.
 */
export const LAATTA_VALIMUISTI = {
  nimi: "viinakatkoily-laatat",
  maxEntries: 400,
  maxAgeSeconds: 7 * 24 * 60 * 60,
} as const;
