import type { KuvaPaate, UusiKatkoPyynto } from "./validointi";

/**
 * Admin-kirjautuminen: master-salasana (alue null) oikeuttaa kaikkeen,
 * alueen oma salasana vain sen alueeseen (ks. workerin tarkistaAdmin).
 */
export interface AdminTunnus {
  salasana: string;
  /** Alueen näytettävä nimi, null = master. */
  alue: string | null;
}

function adminOtsakkeet(tunnus: AdminTunnus): Record<string, string> {
  return {
    "X-Admin-Salasana": tunnus.salasana,
    // Header-arvot eivät salli kaikkia Unicode-merkkejä, joten nimi enkoodataan.
    ...(tunnus.alue ? { "X-Admin-Alue": encodeURIComponent(tunnus.alue) } : {}),
  };
}

export interface MuokkausKatkoPyynto {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: { tiedostopaate: KuvaPaate; data: string } | null;
  piilotaLahimmasta: boolean;
  pullonKokoMl: number | null;
}

/**
 * Tarkistaa admin-tunnuksen Workerista ilman sivuvaikutuksia. Käytetään
 * admin-sivun kirjautumislomakkeessa, jotta väärästä salasanasta näkee
 * virheen heti eikä vasta ensimmäistä kätköä luodessa. Palauttaa, onko
 * tunnus master (kaikki alueet).
 */
export async function kirjauduAdmin(tunnus: AdminTunnus): Promise<{ kaikki: boolean }> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/kirjaudu`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: adminOtsakkeet(tunnus),
  });

  const data = (await vastaus.json().catch(() => null)) as { error?: string; kaikki?: boolean } | null;
  if (!vastaus.ok) {
    throw new Error(data?.error ?? "Väärä salasana");
  }
  return { kaikki: data?.kaikki === true };
}

/**
 * Luo uuden alueen omalla salasanalla — kuka tahansa voi luoda alueen.
 * Kuten löydöt, vaatii vain jaetun bottisalasanan.
 */
export async function luoAlue(alue: string, salasana: string): Promise<void> {
  const vastaus = await fetch(`${import.meta.env.VITE_LOYTO_API_URL}/alue/luo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Jaettu-Salasana": import.meta.env.VITE_LOYTO_SALASANA,
    },
    body: JSON.stringify({ alue, salasana }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Alueen luonti epäonnistui");
  }
}

/**
 * Postaa uuden kätkön Cloudflare Workeriin, joka validoi pyynnön uudelleen
 * (mm. id:n uniikkius) ja kirjoittaa sen D1-tietokantaan sekä kuvan
 * R2-varastoon (ks. worker/). Admin-salasana annetaan käyttäjän toimesta
 * lomakkeessa — sitä EI upoteta build-aikaiseen env-muuttujaan, koska se
 * antaisi kirjoitusoikeuden tietokantaan kenelle tahansa joka lukee bundlen.
 */
export async function luoKatko(pyynto: UusiKatkoPyynto, tunnus: AdminTunnus): Promise<{ id: string }> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/luo-katko`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminOtsakkeet(tunnus),
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
 * Postaa muokatun kätkön Cloudflare Workeriin. `kuva: null` säilyttää
 * nykyisen kuvan — uusi kuva lähetetään vain jos admin valitsi sellaisen.
 */
export async function muokkaaKatko(
  pyynto: MuokkausKatkoPyynto,
  tunnus: AdminTunnus,
): Promise<{ id: string }> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/muokkaa-katko`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminOtsakkeet(tunnus),
    },
    body: JSON.stringify(pyynto),
  });

  const data = (await vastaus.json().catch(() => null)) as
    | { ok: true; id: string }
    | { error: string }
    | null;

  if (!vastaus.ok || !data || !("ok" in data) || !data.ok) {
    const virhe = data && "error" in data ? data.error : "Kätkön päivitys epäonnistui";
    throw new Error(virhe);
  }

  return { id: data.id };
}

/**
 * Postaa kätkön poistopyynnön Cloudflare Workeriin. Poistaa kätkön ja sen
 * kaikki löydöt D1:stä sekä kuvan R2:sta.
 */
export async function poistaKatko(id: string, tunnus: AdminTunnus): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/poista-katko`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminOtsakkeet(tunnus),
    },
    body: JSON.stringify({ id }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Kätkön poisto epäonnistui");
  }
}

/** Asettaa alueen pelimoodin (ks. features/pelimoodit/). Alue tunnistetaan normalisoidulla nimellä. */
export async function asetaPelimoodi(
  alueAvain: string,
  pelimoodi: string,
  tunnus: AdminTunnus,
): Promise<void> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/admin/aseta-pelimoodi`;

  const vastaus = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...adminOtsakkeet(tunnus),
    },
    body: JSON.stringify({ alueAvain, pelimoodi }),
  });

  if (!vastaus.ok) {
    const data = (await vastaus.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Pelimoodin tallennus epäonnistui");
  }
}
