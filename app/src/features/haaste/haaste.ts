import type { Loyto } from "../paikat/types";

/** Aikarajattu yhteishaaste (ks. worker/src/validointi.ts:n Haaste). */
export interface Haaste {
  nimi: string;
  alku: string;
  loppu: string;
  tavoite: number;
}

export type HaasteenTila = "tulossa" | "kaynnissa" | "paattynyt";

export interface HaasteenEteneminen {
  tila: HaasteenTila;
  /** Montako eri kätköä on löydetty haasteen aikana (kuka tahansa löytäjä). */
  loydetty: number;
  tavoite: number;
  onnistui: boolean;
  /** Aikaa jäljellä loppuun (kaynnissa) tai alkuun (tulossa), muuten 0. */
  aikaaMs: number;
}

/**
 * Haasteen eteneminen pelkistä löydöistä: kätkö lasketaan kerran, jos
 * jollakulla on siitä löytö välillä [alku, loppu]. Edistymistä ei tallenneta.
 */
export function haasteenEteneminen(haaste: Haaste, loydot: Loyto[], nyt: number): HaasteenEteneminen {
  const alku = Date.parse(haaste.alku);
  const loppu = Date.parse(haaste.loppu);

  const katkot = new Set(
    loydot
      .filter((l) => {
        const t = Date.parse(l.aika);
        return t >= alku && t <= loppu;
      })
      .map((l) => l.paikkaId),
  );
  const loydetty = katkot.size;

  const tila: HaasteenTila = nyt < alku ? "tulossa" : nyt <= loppu ? "kaynnissa" : "paattynyt";
  const aikaaMs = tila === "tulossa" ? alku - nyt : tila === "kaynnissa" ? loppu - nyt : 0;

  return { tila, loydetty, tavoite: haaste.tavoite, onnistui: loydetty >= haaste.tavoite, aikaaMs };
}

export async function haeHaaste(): Promise<Haaste | null> {
  const vastaus = await fetch(`${import.meta.env.VITE_LOYTO_API_URL}/haaste`);
  if (!vastaus.ok) throw new Error("Haasteen haku epäonnistui");
  return (await vastaus.json()) as Haaste | null;
}

export async function asetaHaaste(haaste: Haaste | null, adminSalasana: string): Promise<void> {
  const vastaus = await fetch(`${import.meta.env.VITE_LOYTO_API_URL}/admin/aseta-haaste`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Salasana": adminSalasana },
    body: JSON.stringify(haaste ?? { poista: true }),
  });
  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Haasteen tallennus epäonnistui");
  }
}
