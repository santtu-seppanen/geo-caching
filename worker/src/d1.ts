export interface Paikka {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
  piilotaLahimmasta: boolean;
  /** Pullon koko millilitroina — valinnainen, null jos ei tiedossa. */
  pullonKokoMl: number | null;
}

export interface Loyto {
  paikkaId: string;
  nimi: string;
  aika: string;
  /** Löytöön kulunut aika millisekunteina, null jos ei tiedossa. */
  kestoMs: number | null;
  /** Löytäjän vapaaehtoinen kommentti, null jos ei jätetty. */
  kommentti: string | null;
}

interface PaikkaRivi {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
  piilota_lahimmasta: number;
  pullon_koko_ml: number | null;
}

interface LoytoRivi {
  paikka_id: string;
  nimi: string;
  aika: string;
  kesto_ms: number | null;
  kommentti: string | null;
}

function paikkaRivista(rivi: PaikkaRivi): Paikka {
  return {
    id: rivi.id,
    alue: rivi.alue,
    kuvaus: rivi.kuvaus,
    lat: rivi.lat,
    lng: rivi.lng,
    kuva: rivi.kuva,
    piilotaLahimmasta: rivi.piilota_lahimmasta === 1,
    pullonKokoMl: rivi.pullon_koko_ml,
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
    .prepare("SELECT paikka_id, nimi, aika, kesto_ms, kommentti FROM loydot ORDER BY id")
    .all<LoytoRivi>();
  return results.map((rivi) => ({
    paikkaId: rivi.paikka_id,
    nimi: rivi.nimi,
    aika: rivi.aika,
    kestoMs: rivi.kesto_ms,
    kommentti: rivi.kommentti,
  }));
}

/** Onko nimimerkki jo merkinnyt tämän kätkön löydetyksi (kirjainkoosta riippumatta). */
export async function onkoJoLoytanyt(
  db: D1Database,
  paikkaId: string,
  nimi: string,
): Promise<boolean> {
  const rivi = await db
    .prepare("SELECT 1 FROM loydot WHERE paikka_id = ? AND LOWER(nimi) = LOWER(?) LIMIT 1")
    .bind(paikkaId, nimi)
    .first();
  return rivi !== null;
}

export async function lisaaLoyto(
  db: D1Database,
  pyynto: { paikkaId: string; nimi: string; kestoMs: number | null; kommentti: string | null; aika?: string | null },
): Promise<Loyto> {
  const aika = pyynto.aika ?? new Date().toISOString();
  await db
    .prepare("INSERT INTO loydot (paikka_id, nimi, aika, kesto_ms, kommentti) VALUES (?, ?, ?, ?, ?)")
    .bind(pyynto.paikkaId, pyynto.nimi, aika, pyynto.kestoMs, pyynto.kommentti)
    .run();
  return { paikkaId: pyynto.paikkaId, nimi: pyynto.nimi, aika, kestoMs: pyynto.kestoMs, kommentti: pyynto.kommentti };
}

export async function lisaaPaikka(db: D1Database, paikka: Paikka): Promise<void> {
  await db
    .prepare(
      "INSERT INTO paikat (id, alue, kuvaus, lat, lng, kuva, piilota_lahimmasta, pullon_koko_ml) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      paikka.id,
      paikka.alue,
      paikka.kuvaus,
      paikka.lat,
      paikka.lng,
      paikka.kuva,
      paikka.piilotaLahimmasta ? 1 : 0,
      paikka.pullonKokoMl,
    )
    .run();
}

/** Hakee kätkön nykyisen kuvatiedoston nimen, tai null jos id:tä ei löydy. */
export async function haePaikkaKuva(db: D1Database, id: string): Promise<string | null> {
  const rivi = await db.prepare("SELECT kuva FROM paikat WHERE id = ?").bind(id).first<{ kuva: string }>();
  return rivi?.kuva ?? null;
}

export async function paivitaPaikka(db: D1Database, paikka: Paikka): Promise<void> {
  await db
    .prepare(
      "UPDATE paikat SET alue = ?, kuvaus = ?, lat = ?, lng = ?, kuva = ?, piilota_lahimmasta = ?, pullon_koko_ml = ? WHERE id = ?",
    )
    .bind(
      paikka.alue,
      paikka.kuvaus,
      paikka.lat,
      paikka.lng,
      paikka.kuva,
      paikka.piilotaLahimmasta ? 1 : 0,
      paikka.pullonKokoMl,
      paikka.id,
    )
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

export interface AlueenPelimoodi {
  alueAvain: string;
  pelimoodi: string;
}

export async function haeAlueidenPelimoodit(db: D1Database): Promise<AlueenPelimoodi[]> {
  const { results } = await db
    .prepare("SELECT alue_avain, pelimoodi FROM alueet")
    .all<{ alue_avain: string; pelimoodi: string }>();
  return results.map((rivi) => ({ alueAvain: rivi.alue_avain, pelimoodi: rivi.pelimoodi }));
}

export async function asetaAlueenPelimoodi(db: D1Database, asetus: AlueenPelimoodi): Promise<void> {
  await db
    .prepare(
      "INSERT INTO alueet (alue_avain, pelimoodi) VALUES (?, ?) ON CONFLICT (alue_avain) DO UPDATE SET pelimoodi = excluded.pelimoodi",
    )
    .bind(asetus.alueAvain, asetus.pelimoodi)
    .run();
}

export interface Haaste {
  nimi: string;
  alku: string;
  loppu: string;
  tavoite: number;
}

export async function haeHaaste(db: D1Database): Promise<Haaste | null> {
  return db.prepare("SELECT nimi, alku, loppu, tavoite FROM haaste WHERE id = 1").first<Haaste>();
}

/** Korvaa nykyisen haasteen; null poistaa sen. */
export async function asetaHaaste(db: D1Database, haaste: Haaste | null): Promise<void> {
  if (!haaste) {
    await db.prepare("DELETE FROM haaste WHERE id = 1").run();
    return;
  }
  await db
    .prepare(
      "INSERT INTO haaste (id, nimi, alku, loppu, tavoite) VALUES (1, ?, ?, ?, ?) ON CONFLICT (id) DO UPDATE SET nimi = excluded.nimi, alku = excluded.alku, loppu = excluded.loppu, tavoite = excluded.tavoite",
    )
    .bind(haaste.nimi, haaste.alku, haaste.loppu, haaste.tavoite)
    .run();
}

export interface Etsinta {
  alueAvain: string;
  /** null jos pelaaja ei ollut vielä antanut nimimerkkiä aloittaessaan. */
  nimi: string | null;
  /** Aloitushetki ISO-muodossa (workerin kello). */
  alkoi: string;
  /** Viimeisin laitteen ilmoittama sijainti (aika workerin kellosta), null jos ei vielä ilmoitettu. */
  sijainti: { lat: number; lng: number; aika: string } | null;
}

/**
 * Kirjaa etsinnän aloituksen (korvaa saman laitteen aiemman aloituksen
 * samalla alueella) ja siivoaa samalla takarajan ylittäneet rivit, jottei
 * taulu kasva loputtomasti.
 */
export async function aloitaEtsinta(
  db: D1Database,
  etsinta: { laiteId: string; alueAvain: string; nimi: string | null },
  nyt: number,
  maxMs: number,
): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM etsinnat WHERE alkoi < ?").bind(new Date(nyt - maxMs).toISOString()),
    db
      .prepare(
        "INSERT INTO etsinnat (laite_id, alue_avain, nimi, alkoi) VALUES (?, ?, ?, ?) ON CONFLICT (laite_id, alue_avain) DO UPDATE SET nimi = excluded.nimi, alkoi = excluded.alkoi",
      )
      .bind(etsinta.laiteId, etsinta.alueAvain, etsinta.nimi, new Date(nyt).toISOString()),
  ]);
}

/** Palauttaa etsinnät, joiden takaraja ei ole vielä umpeutunut (laite_id jätetään pois). */
export async function haeKaynnissaOlevatEtsinnat(db: D1Database, nyt: number, maxMs: number): Promise<Etsinta[]> {
  const { results } = await db
    .prepare("SELECT alue_avain, nimi, alkoi, lat, lng, sijainti_aika FROM etsinnat WHERE alkoi >= ? ORDER BY alkoi")
    .bind(new Date(nyt - maxMs).toISOString())
    .all<{
      alue_avain: string;
      nimi: string | null;
      alkoi: string;
      lat: number | null;
      lng: number | null;
      sijainti_aika: string | null;
    }>();
  return results.map((rivi) => ({
    alueAvain: rivi.alue_avain,
    nimi: rivi.nimi,
    alkoi: rivi.alkoi,
    sijainti:
      rivi.lat !== null && rivi.lng !== null && rivi.sijainti_aika !== null
        ? { lat: rivi.lat, lng: rivi.lng, aika: rivi.sijainti_aika }
        : null,
  }));
}

/**
 * Päivittää käynnissä olevan etsinnän sijainnin (ja nimimerkin, jos se on
 * nyt tiedossa). Palauttaa false, jos laitteella ei ole alueella käynnissä
 * olevaa etsintää — sijaintia ei tallenneta ilman etsintää.
 */
export async function paivitaEtsinnanSijainti(
  db: D1Database,
  sijainti: { laiteId: string; alueAvain: string; nimi: string | null; lat: number; lng: number },
  nyt: number,
  maxMs: number,
): Promise<boolean> {
  const tulos = await db
    .prepare(
      "UPDATE etsinnat SET lat = ?, lng = ?, sijainti_aika = ?, nimi = COALESCE(?, nimi) WHERE laite_id = ? AND alue_avain = ? AND alkoi >= ?",
    )
    .bind(
      sijainti.lat,
      sijainti.lng,
      new Date(nyt).toISOString(),
      sijainti.nimi,
      sijainti.laiteId,
      sijainti.alueAvain,
      new Date(nyt - maxMs).toISOString(),
    )
    .run();
  return tulos.meta.changes > 0;
}
