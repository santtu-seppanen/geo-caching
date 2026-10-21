import { haeLaiteId } from "../../lib/laiteId";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";

export interface KaynnissaOlevaEtsinta {
  /** Normalisoitu alue-nimi (ks. normalisoiAlueNimi). */
  alueAvain: string;
  /** null jos pelaajalla ei ollut vielä nimimerkkiä aloittaessaan. */
  nimi: string | null;
  /** Aloitushetki ISO-muodossa (workerin kello). */
  alkoi: string;
  /** Etsijän viimeisin sijainti (aika workerin kellosta), null jos ei vielä ilmoitettu. */
  sijainti: { lat: number; lng: number; aika: string } | null;
}

/**
 * Ilmoittaa etsinnän aloituksen workerille tilannekuvaa (/tilannekuva)
 * varten. Pelin oma etsintätila asuu laitteella (ks. pelitila.ts), joten
 * epäonnistuminen ei haittaa pelaamista — se vain jää tilannekuvasta pois.
 */
export function ilmoitaEtsinnanAloitus(alueAvain: string): void {
  fetch(`${import.meta.env.VITE_LOYTO_API_URL}/aloita-etsinta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
    },
    body: JSON.stringify({ laiteId: haeLaiteId(), alueAvain, nimi: haePelaajanNimi() }),
  }).catch(() => {});
}

/**
 * Lähettää etsijän sijainnin tilannekuvaa varten. Kuten aloitusilmoitus,
 * epäonnistuminen ei haittaa pelaamista. Mukana tämänhetkinen nimimerkki,
 * jotta nimettömänä aloittanut saa nimensä näkyviin ensimmäisen löydön jälkeen.
 */
export function ilmoitaEtsinnanSijainti(alueAvain: string, sijainti: { lat: number; lng: number }): void {
  fetch(`${import.meta.env.VITE_LOYTO_API_URL}/etsinta-sijainti`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
    },
    body: JSON.stringify({
      laiteId: haeLaiteId(),
      alueAvain,
      nimi: haePelaajanNimi(),
      lat: sijainti.lat,
      lng: sijainti.lng,
    }),
  }).catch(() => {});
}

/** Etsinnät, joiden 3 h takaraja ei ole vielä umpeutunut (vanhin ensin). */
export async function haeKaynnissaOlevatEtsinnat(): Promise<KaynnissaOlevaEtsinta[]> {
  const vastaus = await fetch(`${import.meta.env.VITE_LOYTO_API_URL}/etsinnat`);
  if (!vastaus.ok) throw new Error("Etsintöjen haku epäonnistui");
  return (await vastaus.json()) as KaynnissaOlevaEtsinta[];
}
