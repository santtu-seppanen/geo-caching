import type { Loyto, Paikka } from "./types";

/**
 * Hakee kätköt Cloudflare Workerista (D1-tietokanta). Data ei ole enää
 * bundlattu mukaan buildiin, joten tämä haku tarvitaan ennen kuin mitään
 * kätköä voidaan näyttää.
 */
export async function haePaikat(): Promise<Paikka[]> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/paikat`;

  const vastaus = await fetch(url);

  if (!vastaus.ok) {
    throw new Error("Kätkötietojen haku epäonnistui");
  }

  return (await vastaus.json()) as Paikka[];
}

/** Hakee vahvistetut löydöt Cloudflare Workerista. */
export async function haeLoydot(): Promise<Loyto[]> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/loydot`;

  const vastaus = await fetch(url);

  if (!vastaus.ok) {
    throw new Error("Löytötietojen haku epäonnistui");
  }

  return (await vastaus.json()) as Loyto[];
}
