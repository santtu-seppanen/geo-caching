import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(import.meta.dirname, "../data");
mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "paikat.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS paikat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kuvaus TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    kuva_tiedosto TEXT,
    luotu TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export interface Paikka {
  id: number;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva_tiedosto: string | null;
  luotu: string;
}
