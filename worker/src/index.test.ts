import { describe, it, expect, beforeEach, vi } from "vitest";
import worker from "./index";
import { ETSINTA_MAX_MS } from "./validointi";

interface Rivit {
  paikat: Record<string, unknown>[];
  loydot: { paikka_id: string; nimi: string; aika: string; kesto_ms: number | null; kommentti: string | null }[];
}

/** Minimaalinen muistinvarainen D1, joka tunnistaa vain tämän workerin /loyda-reitin kyselyt. */
function luoDb(rivit: Rivit): D1Database {
  return {
    prepare(sql: string) {
      let arvot: unknown[] = [];
      const kasittelija = {
        bind(...a: unknown[]) {
          arvot = a;
          return kasittelija;
        },
        async all() {
          if (sql.startsWith("SELECT * FROM paikat")) return { results: rivit.paikat };
          if (sql.startsWith("SELECT id FROM paikat")) {
            return { results: rivit.paikat.map((p) => ({ id: p.id })) };
          }
          throw new Error(`Tuntematon kysely: ${sql}`);
        },
        async first() {
          if (sql.includes("FROM loydot WHERE paikka_id")) {
            const [paikkaId, nimi] = arvot as [string, string];
            const osuma = rivit.loydot.find(
              (l) => l.paikka_id === paikkaId && l.nimi.toLowerCase() === nimi.toLowerCase(),
            );
            return osuma ? { 1: 1 } : null;
          }
          throw new Error(`Tuntematon kysely: ${sql}`);
        },
        async run() {
          if (sql.startsWith("INSERT INTO loydot")) {
            const [paikka_id, nimi, aika, kesto_ms, kommentti] = arvot as [string, string, string, number | null, string | null];
            rivit.loydot.push({ paikka_id, nimi, aika, kesto_ms, kommentti });
            return { success: true };
          }
          throw new Error(`Tuntematon kysely: ${sql}`);
        },
      };
      return kasittelija;
    },
  } as unknown as D1Database;
}

const SALASANA = "jaettu";
const KATKO = { lat: 60.17, lng: 24.94 };

function luoEnv(rivit: Rivit) {
  return {
    DB: luoDb(rivit),
    KUVAT: {} as R2Bucket,
    JAETTU_SALASANA: SALASANA,
    ADMIN_SALASANA: "admin",
    CORS_ORIGIN: "*",
  };
}

function loyda(env: ReturnType<typeof luoEnv>, body: unknown, salasana: string | null = SALASANA) {
  return worker.fetch(
    new Request("https://worker.test/loyda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(salasana !== null ? { "X-Jaettu-Salasana": salasana } : {}),
      },
      body: JSON.stringify(body),
    }),
    env,
  );
}

describe("POST /loyda", () => {
  let rivit: Rivit;
  let env: ReturnType<typeof luoEnv>;

  beforeEach(() => {
    rivit = { paikat: [{ id: "neittava-1", alue: "Neittävä", kuvaus: "k", ...KATKO, kuva: "k.webp", piilota_lahimmasta: 0, pullon_koko_ml: null }], loydot: [] };
    env = luoEnv(rivit);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("kirjaa löydön kätkön lähellä (201)", async () => {
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "Matti", ...KATKO });
    expect(vastaus.status).toBe(201);
    expect(rivit.loydot).toHaveLength(1);
    expect(rivit.loydot[0].nimi).toBe("Matti");
  });

  it("hylkää väärän salasanan (401) tallentamatta mitään", async () => {
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "Matti", ...KATKO }, "väärä");
    expect(vastaus.status).toBe(401);
    expect(rivit.loydot).toHaveLength(0);
  });

  it("hylkää tuplan kirjainkoosta riippumatta (409)", async () => {
    await loyda(env, { paikkaId: "neittava-1", nimi: "Matti", ...KATKO });
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "MATTI", ...KATKO });
    expect(vastaus.status).toBe(409);
    expect(rivit.loydot).toHaveLength(1);
  });

  it("hylkää tuntemattoman kätkön (400)", async () => {
    const vastaus = await loyda(env, { paikkaId: "ei-ole-1", nimi: "Matti", ...KATKO });
    expect(vastaus.status).toBe(400);
  });

  it("hylkää puuttuvan sijainnin (400)", async () => {
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "Matti" });
    expect(vastaus.status).toBe(400);
    expect(rivit.loydot).toHaveLength(0);
  });

  it("hylkää liian kaukaa tehdyn löydön (403)", async () => {
    // ~1,1 km pohjoiseen
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "Matti", lat: KATKO.lat + 0.01, lng: KATKO.lng });
    expect(vastaus.status).toBe(403);
    expect(rivit.loydot).toHaveLength(0);
  });

  it("hyväksyy löydön juuri sallitun etäisyyden sisällä", async () => {
    // 0,001° lat ≈ 111 m < 150 m
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "Matti", lat: KATKO.lat + 0.001, lng: KATKO.lng });
    expect(vastaus.status).toBe(201);
  });

  it("tallentaa keston ja hylkää etsinnän 3 h takarajan ylityksen", async () => {
    const ok = await loyda(env, { paikkaId: "neittava-1", nimi: "A", ...KATKO, kestoMs: 60_000, etsintaKestoMs: 120_000 });
    expect(ok.status).toBe(201);
    expect(rivit.loydot[0].kesto_ms).toBe(60_000);

    const liianPitka = await loyda(env, { paikkaId: "neittava-1", nimi: "B", ...KATKO, kestoMs: 1000, etsintaKestoMs: ETSINTA_MAX_MS + 1 });
    expect(liianPitka.status).toBe(400);
    expect(rivit.loydot).toHaveLength(1);
  });

  it("tallentaa trimmatun kommentin ja hylkää liian pitkän", async () => {
    const ok = await loyda(env, { paikkaId: "neittava-1", nimi: "A", ...KATKO, kommentti: "  Puun takana!  " });
    expect(ok.status).toBe(201);
    expect(rivit.loydot[0].kommentti).toBe("Puun takana!");

    const pitka = await loyda(env, { paikkaId: "neittava-1", nimi: "B", ...KATKO, kommentti: "x".repeat(141) });
    expect(pitka.status).toBe(400);
    expect(rivit.loydot).toHaveLength(1);
  });

  it("käyttää clientin ilmoittamaa löytöhetkeä", async () => {
    const aika = new Date(Date.now() - 600_000).toISOString();
    const vastaus = await loyda(env, { paikkaId: "neittava-1", nimi: "A", ...KATKO, aika });
    expect(vastaus.status).toBe(201);
    expect(rivit.loydot[0].aika).toBe(aika);
  });

  it("hylkää virheellisen JSON:in (400)", async () => {
    const vastaus = await worker.fetch(
      new Request("https://worker.test/loyda", {
        method: "POST",
        headers: { "X-Jaettu-Salasana": SALASANA },
        body: "{ei json",
      }),
      env,
    );
    expect(vastaus.status).toBe(400);
  });
});

describe("admin-reitit", () => {
  it("vaativat admin-salasanan", async () => {
    const env = luoEnv({ paikat: [], loydot: [] });
    for (const polku of ["/admin/luo-katko", "/admin/poista-katko", "/admin/aseta-pelimoodi", "/admin/aseta-haaste", "/admin/muokkaa-katko"]) {
      const vastaus = await worker.fetch(
        new Request(`https://worker.test${polku}`, {
          method: "POST",
          headers: { "X-Admin-Salasana": "väärä" },
          body: "{}",
        }),
        env,
      );
      expect(vastaus.status, polku).toBe(401);
    }
  });
});
