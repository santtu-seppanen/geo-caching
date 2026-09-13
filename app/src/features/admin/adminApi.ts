import type { UusiKatkoPyynto } from "./validointi";

/**
 * Postaa uuden kätkön Cloudflare Workeriin, joka validoi pyynnön uudelleen
 * (mm. id:n uniikkius) ja kirjoittaa sen D1-tietokantaan sekä kuvan
 * R2-varastoon (ks. worker/). Admin-salasana annetaan käyttäjän toimesta
 * lomakkeessa — sitä EI upoteta build-aikaiseen env-muuttujaan, koska se
 * antaisi kirjoitusoikeuden tietokantaan kenelle tahansa joka lukee bundlen.
 */
export async function luoKatko(pyynto: UusiKatkoPyynto, adminSalasana: string): Promise<{ id: string }> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/luo-katko`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Salasana": adminSalasana,
    },
    body: JSON.stringify(pyynto),
  });

  const data = (await vastaus.json().catch(() => null)) as
    | { ok: true; id: string }
    | { error: string }
    | null;

  if (!vastaus.ok || !data || !("ok" in data) || !data.ok) {
    const virhe = data && "error" in data ? data.error : "Kätkön luonti epäonnistui";
    throw new Error(virhe);
  }

  return { id: data.id };
}

/**
 * Postaa kätkön poistopyynnön Cloudflare Workeriin. Poistaa kätkön ja sen
 * kaikki löydöt D1:stä sekä kuvan R2:sta.
 */
export async function poistaKatko(id: string, adminSalasana: string): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/poista-katko`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Salasana": adminSalasana,
    },
    body: JSON.stringify({ id }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Kätkön poisto epäonnistui");
  }
}
