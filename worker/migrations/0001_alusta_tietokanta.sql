CREATE TABLE paikat (
  id TEXT PRIMARY KEY,
  alue TEXT NOT NULL,
  alue_vihje TEXT NOT NULL,
  kuvaus TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  kuva TEXT NOT NULL
);

CREATE TABLE loydot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paikka_id TEXT NOT NULL,
  nimi TEXT NOT NULL,
  aika TEXT NOT NULL
);

CREATE INDEX idx_loydot_paikka_id ON loydot (paikka_id);
