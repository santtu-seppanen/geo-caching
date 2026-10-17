export interface Mittaus {
  lat: number;
  lng: number;
  etaisyysMetreina: number;
  /** Date.now() mittaushetkellä. */
  aika: number;
}

export interface Pelitila {
  mittaukset: Mittaus[];
}

const ETULIITE = "viinakatkoily.pelitila.";

export const TYHJA_PELITILA: Pelitila = { mittaukset: [] };

/**
 * Kätkökohtainen etsintätila (kolmiomittaukset) muistetaan laitteella
 * localStorage:ssa. Kuten pelaajanNimi.ts, pelkkä laitekohtainen muisti —
 * tällä ei ole tarkoitus estää huijaamista.
 */
export function lataaPelitila(paikkaId: string): Pelitila {
  try {
    const raaka = window.localStorage.getItem(ETULIITE + paikkaId);
    if (!raaka) return TYHJA_PELITILA;
    const data = JSON.parse(raaka) as Partial<Pelitila>;
    return {
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

const ETSINTA_ETULIITE = "viinakatkoily.etsinta.";

/**
 * Milloin pelaaja aloitti alueen etsinnän (Date.now()), null jos ei ole
 * aloittanut. Avaimena normalisoitu alue-nimi (ks. normalisoiAlueNimi).
 * Vihjeiden ja ajastetun haun vuorot sekä löytöjen kestot johdetaan tästä
 * (ks. etsinta.ts), joten uusi aloitus nollaa ne kaikki.
 */
export function lataaEtsinnanAlku(alueAvain: string): number | null {
  try {
    const arvo = Number(window.localStorage.getItem(ETSINTA_ETULIITE + alueAvain));
    return Number.isFinite(arvo) && arvo > 0 ? arvo : null;
  } catch {
    return null;
  }
}

export function tallennaEtsinnanAlku(alueAvain: string, alkoi: number): void {
  try {
    window.localStorage.setItem(ETSINTA_ETULIITE + alueAvain, String(alkoi));
  } catch {
    // Hiljainen epäonnistuminen — etsintä on käynnissä vain tämän sivulatauksen ajan.
  }
}
