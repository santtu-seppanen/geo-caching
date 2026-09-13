export interface Paikka {
  id: string;
  alue: string;
  alueVihje: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
}

export interface Loyto {
  paikkaId: string;
  nimi: string;
  aika: string;
}

interface PaikkaRivi {
  id: string;
  alue: string;
  alue_vihje: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
}

interface LoytoRivi {
  paikka_id: string;
  nimi: string;
  aika: string;
}

function paikkaRivista(rivi: PaikkaRivi): Paikka {
  return {
    id: rivi.id,
    alue: rivi.alue,
    alueVihje: rivi.alue_vihje,
    kuvaus: rivi.kuvaus,
    lat: rivi.lat,
    lng: rivi.lng,
    kuva: rivi.kuva,
  };
}

export async function haePaikat(db: D1Database): Promise<Paikka[]> {
  const { results } = await db.prepare("SELECT * FROM paikat ORDER BY rowid").all<PaikkaRivi>();
  return results.map(paikkaRivista);
}

export async function haePaikkaIdt(db: D1Database): Promise<Set<string>> {
  const { results } = await db.prepare("SELECT id FROM paikat").all<{ id: string }>();
  return new Set(results.map((rivi) => rivi.id));
}

export async function haeLoydot(db: D1Database): Promise<Loyto[]> {
  const { results } = await db
    .prepare("SELECT paikka_id, nimi, aika FROM loydot ORDER BY id")
    .all<LoytoRivi>();
  return results.map((rivi) => ({ paikkaId: rivi.paikka_id, nimi: rivi.nimi, aika: rivi.aika }));
}

export async function lisaaLoyto(
  db: D1Database,
  pyynto: { paikkaId: string; nimi: string },
): Promise<Loyto> {
  const aika = new Date().toISOString();
  await db
    .prepare("INSERT INTO loydot (paikka_id, nimi, aika) VALUES (?, ?, ?)")
    .bind(pyynto.paikkaId, pyynto.nimi, aika)
    .run();
  return { paikkaId: pyynto.paikkaId, nimi: pyynto.nimi, aika };
}

export async function lisaaPaikka(db: D1Database, paikka: Paikka): Promise<void> {
  await db
    .prepare(
      "INSERT INTO paikat (id, alue, alue_vihje, kuvaus, lat, lng, kuva) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(paikka.id, paikka.alue, paikka.alueVihje, paikka.kuvaus, paikka.lat, paikka.lng, paikka.kuva)
    .run();
}

/**
 * Poistaa kätkön ja sen löydöt. Palauttaa poistetun kätkön kuvatiedoston
 * nimen (jotta kutsuja voi poistaa myös R2-objektin), tai null jos id:tä ei
 * löytynyt.
 */
export async function poistaPaikka(db: D1Database, id: string): Promise<string | null> {
  const rivi = await db
    .prepare("SELECT kuva FROM paikat WHERE id = ?")
    .bind(id)
    .first<{ kuva: string }>();
  if (!rivi) return null;

  await db.batch([
    db.prepare("DELETE FROM loydot WHERE paikka_id = ?").bind(id),
    db.prepare("DELETE FROM paikat WHERE id = ?").bind(id),
  ]);

  return rivi.kuva;
}
