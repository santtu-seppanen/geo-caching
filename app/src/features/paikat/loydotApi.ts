import type { JonotettuLoyto } from "../../lib/loytoJono";
import { lahetaJono } from "../../lib/loytoJono";

/** Verkkoyhteys puuttui tai palvelin oli tavoittamattomissa — löytö voidaan jonottaa ja yrittää myöhemmin. */
export class VerkkoVirhe extends Error {}

/**
 * Postaa löydön Cloudflare Workeriin, joka kirjoittaa sen D1-tietokantaan
 * (ks. worker/). Käyttäjä näkee oman löytönsä heti optimistisesti
 * lisättynä — muut näkevät sen seuraavalla `/loydot`-haulla.
 *
 * `kestoMs`/`etsintaKestoMs` vain käynnissä olevan etsinnän aikana (worker
 * hylkää löydön, jos etsintä on ylittänyt takarajan). Heittää VerkkoVirheen,
 * jos yhteys puuttuu tai palvelin vastaa 5xx.
 */
export async function ilmoitaLoyto(loyto: JonotettuLoyto): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/loyda`;

  let vastaus: Response;
  try {
    vastaus = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
      },
      body: JSON.stringify({
        paikkaId: loyto.paikkaId,
        nimi: loyto.nimi,
        aika: loyto.aika,
        lat: loyto.lat ?? undefined,
        lng: loyto.lng ?? undefined,
        kommentti: loyto.kommentti,
        ...(loyto.kestoMs !== null && loyto.etsintaKestoMs !== null
          ? { kestoMs: loyto.kestoMs, etsintaKestoMs: loyto.etsintaKestoMs }
          : {}),
      }),
    });
  } catch {
    throw new VerkkoVirhe("Ei verkkoyhteyttä");
  }

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    const viesti = data?.error ?? "Löydön tallennus epäonnistui";
    throw vastaus.status >= 500 ? new VerkkoVirhe(viesti) : new Error(viesti);
  }
}

/** Lähettää laitteelle jonotetut löydöt; palauttaa lähetettyjen määrän. */
export function lahetaJonotetutLoydot(): Promise<number> {
  return lahetaJono(ilmoitaLoyto, (virhe) => virhe instanceof VerkkoVirhe);
}
