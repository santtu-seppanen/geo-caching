import paikatData from "../../app/src/data/paikat.json";
import { kirjaaLoytoGithubiin, type GithubEnv } from "./github.js";
import { validoiLoytoPyynto } from "./validointi.js";

interface Env extends GithubEnv {
  JAETTU_SALASANA: string;
  CORS_ORIGIN: string;
}

interface PaikkaId {
  id: string;
}

const tunnetutPaikkaIdt = new Set(
  (paikatData as PaikkaId[]).map((paikka) => paikka.id),
);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.CORS_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Jaettu-Salasana",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/loyda") {
      return jsonVastaus({ error: "Reittiä ei löydy" }, 404, corsHeaders);
    }

    if (request.headers.get("X-Jaettu-Salasana") !== env.JAETTU_SALASANA) {
      return jsonVastaus({ error: "Virheellinen salasana" }, 401, corsHeaders);
    }

    let data: unknown;
    try {
      data = await request.json();
    } catch {
      return jsonVastaus({ error: "Virheellinen JSON" }, 400, corsHeaders);
    }

    const tulos = validoiLoytoPyynto(data, tunnetutPaikkaIdt);
    if (!tulos.ok) {
      return jsonVastaus({ error: tulos.virhe }, 400, corsHeaders);
    }

    try {
      await kirjaaLoytoGithubiin(tulos.pyynto, env);
    } catch (virhe) {
      console.error(virhe);
      return jsonVastaus(
        { error: "Löydön tallennus GitHubiin epäonnistui" },
        502,
        corsHeaders,
      );
    }

    return jsonVastaus({ ok: true }, 201, corsHeaders);
  },
};

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
