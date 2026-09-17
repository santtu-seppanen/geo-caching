const AVAIN = "viinakatkoily.pelaajan-nimi";

/**
 * Muistaa viimeksi käytetyn löytäjän nimimerkin tällä laitteella, jotta
 * sitä ei tarvitse kirjoittaa joka löydöllä uudelleen ja jotta "omat
 * löydöt" -näkymä voi suodattaa löydöt sen perusteella. Sovelluksella ei
 * ole käyttäjätilejä eikä tätä ole tarkoitus käyttää sellaisena — pelkkä
 * laitekohtainen muisti riittää.
 */
export function haePelaajanNimi(): string {
  try {
    return window.localStorage.getItem(AVAIN) ?? "";
  } catch {
    return "";
  }
}

export function tallennaPelaajanNimi(nimi: string): void {
  try {
    window.localStorage.setItem(AVAIN, nimi);
  } catch {
    // Hiljainen epäonnistuminen (esim. yksityinen selaus) — nimeä ei silloin muisteta.
  }
}
