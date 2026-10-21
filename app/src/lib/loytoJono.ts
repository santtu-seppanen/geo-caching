const AVAIN = "viinakatkoily.loytojono";

/** Löytö, jota ei saatu lähetettyä (ei verkkoa) ja joka lähetetään myöhemmin. */
export interface JonotettuLoyto {
  paikkaId: string;
  nimi: string;
  /** Löytöhetki (ISO) — säilyy jonotuksen yli, jotta mitalijärjestys vastaa oikeaa löytöhetkeä. */
  aika: string;
  kestoMs: number | null;
  etsintaKestoMs: number | null;
  lat: number | null;
  lng: number | null;
  kommentti: string | null;
}

export function haeJono(): JonotettuLoyto[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(AVAIN) ?? "[]");
    return Array.isArray(data) ? (data as JonotettuLoyto[]) : [];
  } catch {
    return [];
  }
}

function tallennaJono(jono: JonotettuLoyto[]): void {
  try {
    window.localStorage.setItem(AVAIN, JSON.stringify(jono));
  } catch {
    // Hiljainen epäonnistuminen (esim. yksityinen selaus) — jono ei silloin säily uudelleenlatauksen yli.
  }
}

const sama = (a: JonotettuLoyto, b: JonotettuLoyto) =>
  a.paikkaId === b.paikkaId && a.nimi.toLowerCase() === b.nimi.toLowerCase();

export function lisaaJonoon(loyto: JonotettuLoyto): void {
  const jono = haeJono();
  if (!jono.some((j) => sama(j, loyto))) tallennaJono([...jono, loyto]);
}

export function poistaJonosta(loyto: JonotettuLoyto): void {
  tallennaJono(haeJono().filter((j) => !sama(j, loyto)));
}

/**
 * Lähettää jonotetut löydöt järjestyksessä. Verkkovirheeseen pysähdytään
 * (jono säilyy ja yritetään myöhemmin); pysyvään virheeseen (esim. 409 tupla,
 * 403 liian kaukana) löytö pudotetaan jonosta, koska uusinta ei auttaisi.
 * Palauttaa onnistuneesti lähetettyjen määrän.
 */
export async function lahetaJono(
  laheta: (loyto: JonotettuLoyto) => Promise<void>,
  onVerkkoVirhe: (virhe: unknown) => boolean,
): Promise<number> {
  let lahetetty = 0;
  for (const loyto of haeJono()) {
    try {
      await laheta(loyto);
      lahetetty++;
    } catch (virhe) {
      if (onVerkkoVirhe(virhe)) break;
    }
    poistaJonosta(loyto);
  }
  return lahetetty;
}
