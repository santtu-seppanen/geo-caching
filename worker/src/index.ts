import {
  haeLoydot,
  haePaikat,
  haePaikkaIdt,
  haePaikkaKuva,
  lisaaLoyto,
  lisaaPaikka,
  onkoJoLoytanyt,
  paivitaPaikka,
  poistaPaikka,
} from "./d1.js";
import { haeKuva, poistaKuva, tallennaKuva } from "./r2.js";
import {
  validoiLoytoPyynto,
  validoiMuokkausKatkoPyynto,
  validoiPoistoPyynto,
  validoiUusiKatkoPyynto,
} from "./validointi.js";

interface Env {
  DB: D1Database;
  KUVAT: R2Bucket;
  JAETTU_SALASANA: string;
  ADMIN_SALASANA: string;
  CORS_ORIGIN: string;
}

const KUVAT_POLKU_ETULIITE = "/kuvat/";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-Jaettu-Salasana, X-Admin-Salasana",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/paikat") {
      const paikat = await haePaikat(env.DB);
      return jsonVastaus(paikat, 200, corsHeaders);
    }

    if (request.method === "GET" && url.pathname === "/loydot") {
      const loydot = await haeLoydot(env.DB);
      return jsonVastaus(loydot, 200, corsHeaders);
    }

    if (request.method === "GET" && url.pathname.startsWith(KUVAT_POLKU_ETULIITE)) {
      return kasitteleKuva(url.pathname.slice(KUVAT_POLKU_ETULIITE.length), env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/loyda") {
      return kasitteleLoyda(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/kirjaudu") {
      return kasitteleKirjautuminen(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/luo-katko") {
      return kasitteleLuoKatko(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/muokkaa-katko") {
      return kasitteleMuokkausKatko(request, env, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/admin/poista-katko") {
      return kasittelePoistoKatko(request, env, corsHeaders);
    }

    return jsonVastaus({ error: "Reittiä ei löydy" }, 404, corsHeaders);
  },
};

async function kasitteleKuva(
  tiedostonimi: string,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const objekti = await haeKuva(env.KUVAT, tiedostonimi);
  if (!objekti) {
    return jsonVastaus({ error: "Kuvaa ei löydy" }, 404, corsHeaders);
  }

  return new Response(objekti.body, {
    status: 200,
    headers: {
      "Content-Type": objekti.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
      ...corsHeaders,
    },
  });
}

async function kasitteleLoyda(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.headers.get("X-Jaettu-Salasana") !== env.JAETTU_SALASANA) {
    return jsonVastaus({ error: "Virheellinen salasana" }, 401, corsHeaders);
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonVastaus({ error: "Virheellinen JSON" }, 400, corsHeaders);
  }

  const tunnetutPaikkaIdt = await haePaikkaIdt(env.DB);
  const tulos = validoiLoytoPyynto(data, tunnetutPaikkaIdt);
  if (!tulos.ok) {
    return jsonVastaus({ error: tulos.virhe }, 400, corsHeaders);
  }

  if (await onkoJoLoytanyt(env.DB, tulos.pyynto.paikkaId, tulos.pyynto.nimi)) {
    return jsonVastaus(
      { error: "Olet jo merkinnyt tämän kätkön löydetyksi" },
      409,
      corsHeaders,
    );
  }

  try {
    await lisaaLoyto(env.DB, tulos.pyynto);
  } catch (virhe) {
    console.error(virhe);
    return jsonVastaus({ error: "Löydön tallennus epäonnistui" }, 502, corsHeaders);
  }

  return jsonVastaus({ ok: true }, 201, corsHeaders);
}

/** Tarkistaa admin-salasanan ilman sivuvaikutuksia, jotta lomake voi näyttää virheen heti kirjautuessa. */
async function kasitteleKirjautuminen(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.headers.get("X-Admin-Salasana") !== env.ADMIN_SALASANA) {
    return jsonVastaus({ error: "Väärä salasana" }, 401, corsHeaders);
  }

  return jsonVastaus({ ok: true }, 200, corsHeaders);
}

async function kasitteleLuoKatko(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.headers.get("X-Admin-Salasana") !== env.ADMIN_SALASANA) {
    return jsonVastaus({ error: "Virheellinen salasana" }, 401, corsHeaders);
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonVastaus({ error: "Virheellinen JSON" }, 400, corsHeaders);
  }

  const tunnetutPaikkaIdt = await haePaikkaIdt(env.DB);
  const tulos = validoiUusiKatkoPyynto(data, tunnetutPaikkaIdt);
  if (!tulos.ok) {
    return jsonVastaus({ error: tulos.virhe }, 400, corsHeaders);
  }

  const { pyynto } = tulos;
  const kuvaTiedosto = `${pyynto.id}.${pyynto.kuva.tiedostopaate}`;

  try {
    await tallennaKuva(env.KUVAT, kuvaTiedosto, pyynto.kuva.data);
    await lisaaPaikka(env.DB, {
      id: pyynto.id,
      alue: pyynto.alue,
      kuvaus: pyynto.kuvaus,
      lat: pyynto.lat,
      lng: pyynto.lng,
      kuva: kuvaTiedosto,
    });
  } catch (virhe) {
    console.error(virhe);
    return jsonVastaus({ error: "Kätkön luonti epäonnistui" }, 502, corsHeaders);
  }

  return jsonVastaus({ ok: true, id: pyynto.id }, 201, corsHeaders);
}

async function kasitteleMuokkausKatko(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.headers.get("X-Admin-Salasana") !== env.ADMIN_SALASANA) {
    return jsonVastaus({ error: "Virheellinen salasana" }, 401, corsHeaders);
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonVastaus({ error: "Virheellinen JSON" }, 400, corsHeaders);
  }

  const tunnetutPaikkaIdt = await haePaikkaIdt(env.DB);
  const tulos = validoiMuokkausKatkoPyynto(data, tunnetutPaikkaIdt);
  if (!tulos.ok) {
    return jsonVastaus({ error: tulos.virhe }, 400, corsHeaders);
  }

  const { pyynto } = tulos;
  const nykyinenKuva = await haePaikkaKuva(env.DB, pyynto.id);
  const kuvaTiedosto = pyynto.kuva
    ? `${pyynto.id}.${pyynto.kuva.tiedostopaate}`
    : (nykyinenKuva ?? "");

  try {
    if (pyynto.kuva) {
      await tallennaKuva(env.KUVAT, kuvaTiedosto, pyynto.kuva.data);
      if (nykyinenKuva && nykyinenKuva !== kuvaTiedosto) {
        await poistaKuva(env.KUVAT, nykyinenKuva);
      }
    }

    await paivitaPaikka(env.DB, {
      id: pyynto.id,
      alue: pyynto.alue,
      kuvaus: pyynto.kuvaus,
      lat: pyynto.lat,
      lng: pyynto.lng,
      kuva: kuvaTiedosto,
    });
  } catch (virhe) {
    console.error(virhe);
    return jsonVastaus({ error: "Kätkön päivitys epäonnistui" }, 502, corsHeaders);
  }

  return jsonVastaus({ ok: true, id: pyynto.id }, 200, corsHeaders);
}

async function kasittelePoistoKatko(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.headers.get("X-Admin-Salasana") !== env.ADMIN_SALASANA) {
    return jsonVastaus({ error: "Virheellinen salasana" }, 401, corsHeaders);
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return jsonVastaus({ error: "Virheellinen JSON" }, 400, corsHeaders);
  }

  const tunnetutPaikkaIdt = await haePaikkaIdt(env.DB);
  const tulos = validoiPoistoPyynto(data, tunnetutPaikkaIdt);
  if (!tulos.ok) {
    return jsonVastaus({ error: tulos.virhe }, 400, corsHeaders);
  }

  try {
    const kuvaTiedosto = await poistaPaikka(env.DB, tulos.pyynto.id);
    if (kuvaTiedosto) {
      await poistaKuva(env.KUVAT, kuvaTiedosto);
    }
  } catch (virhe) {
    console.error(virhe);
    return jsonVastaus({ error: "Kätkön poisto epäonnistui" }, 502, corsHeaders);
  }

  return jsonVastaus({ ok: true }, 200, corsHeaders);
}

function jsonVastaus(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
