/**
 * Postaa löydön Cloudflare Workeriin, joka kirjoittaa sen loydot.json:iin
 * gitissä (ks. worker/). Käyttäjä näkee oman löytönsä heti optimistisesti
 * lisättynä — muut näkevät sen vasta seuraavan Pages-deployn jälkeen.
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
