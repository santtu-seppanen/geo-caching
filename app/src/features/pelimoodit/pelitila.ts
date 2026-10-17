export interface Mittaus {
  lat: number;
  lng: number;
  etaisyysMetreina: number;
  /** Date.now() mittaushetkellä. */
  aika: number;
}

export interface Pelitila {
  /** Date.now() kun vihjeiden ajastin käynnistyi, null jos ei vielä. */
  alkoi: number | null;
  mittaukset: Mittaus[];
}

const ETULIITE = "viinakatkoily.pelitila.";

export const TYHJA_PELITILA: Pelitila = { alkoi: null, mittaukset: [] };

/**
 * Kätkökohtainen etsintätila (vihjeajastin, kolmiomittaukset) muistetaan
 * laitteella localStorage:ssa, ettei sivun uudelleenlataus nollaa
 * vihjeiden odotusaikaa. Kuten pelaajanNimi.ts, pelkkä laitekohtainen
 * muisti — tällä ei ole tarkoitus estää huijaamista.
 */
export function lataaPelitila(paikkaId: string): Pelitila {
  try {
    const raaka = window.localStorage.getItem(ETULIITE + paikkaId);
    if (!raaka) return TYHJA_PELITILA;
    const data = JSON.parse(raaka) as Partial<Pelitila>;
    return {
      alkoi: typeof data.alkoi === "number" ? data.alkoi : null,
      mittaukset: Array.isArray(data.mittaukset) ? data.mittaukset : [],
    };
  } catch {
    return TYHJA_PELITILA;
  }
}

export function tallennaPelitila(paikkaId: string, tila: Pelitila): void {
  try {
    window.localStorage.setItem(ETULIITE + paikkaId, JSON.stringify(tila));
  } catch {
    // Hiljainen epäonnistuminen (esim. yksityinen selaus) — tila säilyy vain tämän sivulatauksen ajan.
  }
}
