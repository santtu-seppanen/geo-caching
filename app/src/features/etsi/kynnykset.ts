/** Etäisyys, jonka sisällä yksittäinen kätkö avautuu (kuva, kuvaus, löytölomake). */
export const KATKO_AVAUTUU_METREINA = 100;

/**
 * Etäisyys, jonka sisällä etusivulla näytetään huomautus lähellä olevasta
 * alueesta ilman että käyttäjän tarvitsee tietää tai kirjoittaa alueen
 * nimeä. Ei paljasta kätkön sisältöä (kuva/kuvaus) — se vaatii edelleen
 * KATKO_AVAUTUU_METREINA-etäisyyden aluesivun kartalla.
 */
export const ALUE_AVAUTUU_METREINA = 2000;
