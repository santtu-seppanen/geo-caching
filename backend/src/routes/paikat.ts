import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { db, type Paikka } from "../db.js";

const uploadsDir = path.resolve(import.meta.dirname, "../../uploads");
mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const paikatRouter = Router();

paikatRouter.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM paikat ORDER BY luotu DESC")
    .all() as Paikka[];
  res.json(rows);
});

paikatRouter.post("/", upload.single("kuva"), (req, res) => {
  const { kuvaus, lat, lng } = req.body as Record<string, string>;

  if (!kuvaus || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "kuvaus, lat ja lng ovat pakollisia" });
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return res.status(400).json({ error: "lat ja lng täytyy olla numeroita" });
  }

  const kuvaTiedosto = req.file?.filename ?? null;

  const result = db
    .prepare(
      "INSERT INTO paikat (kuvaus, lat, lng, kuva_tiedosto) VALUES (?, ?, ?, ?)",
    )
    .run(kuvaus, latNum, lngNum, kuvaTiedosto);

  const paikka = db
    .prepare("SELECT * FROM paikat WHERE id = ?")
    .get(result.lastInsertRowid) as Paikka;

  res.status(201).json(paikka);
});

paikatRouter.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM paikat WHERE id = ?")
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "paikkaa ei löytynyt" });
  }

  res.status(204).end();
});
