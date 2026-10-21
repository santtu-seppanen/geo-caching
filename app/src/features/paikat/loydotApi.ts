/**
 * Postaa löydön Cloudflare Workeriin, joka kirjoittaa sen D1-tietokantaan
 * (ks. worker/). Käyttäjä näkee oman löytönsä heti optimistisesti
 * lisättynä — muut näkevät sen seuraavalla `/loydot`-haulla.
 */
/**
 * `ajat` vain käynnissä olevan etsinnän aikana: kestoMs edellisestä
 * löydöstä tai aloituksesta, etsintaKestoMs aloituksesta (worker hylkää
 * löydön, jos se ylittää etsinnän takarajan).
 */
export async function ilmoitaLoyto(
  paikkaId: string,
  nimi: string,
  ajat: { kestoMs: number; etsintaKestoMs: number } | null,
  sijainti: { lat: number; lng: number } | null,
  kommentti: string | null = null,
): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/loyda`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
    },
    body: JSON.stringify({ paikkaId, nimi, lat: sijainti?.lat, lng: sijainti?.lng, kommentti, ...ajat }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Löydön tallennus epäonnistui");
  }
}
