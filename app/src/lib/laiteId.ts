const AVAIN = "viinakatkoily.laite-id";

/**
 * Laitteen satunnainen, pysyvä tunniste — tilannekuvan etsintäilmoitusten
 * avain (ks. features/pelimoodit/etsinnatApi.ts), jotta saman laitteen uusi
 * aloitus korvaa vanhan. Kuten pelaajanNimi.ts, pelkkä laitekohtainen
 * muisti eikä käyttäjätili.
 */
export function haeLaiteId(): string {
  try {
    const tallennettu = window.localStorage.getItem(AVAIN);
    if (tallennettu) return tallennettu;
    const uusi = crypto.randomUUID();
    window.localStorage.setItem(AVAIN, uusi);
    return uusi;
  } catch {
    // Ilman localStoragea tunniste vaihtuu joka sivulatauksella — riittää tähän.
    return crypto.randomUUID();
  }
}
