/**
 * Postaa löydön Cloudflare Workeriin, joka kirjoittaa sen D1-tietokantaan
 * (ks. worker/). Käyttäjä näkee oman löytönsä heti optimistisesti
 * lisättynä — muut näkevät sen seuraavalla `/loydot`-haulla.
 */
export async function ilmoitaLoyto(paikkaId: string, nimi: string): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/loyda`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
    },
    body: JSON.stringify({ paikkaId, nimi }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Löydön tallennus epäonnistui");
  }
}
