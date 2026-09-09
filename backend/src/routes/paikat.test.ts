import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../index.js";
import { db } from "../db.js";

describe("paikat-reitit", () => {
  beforeEach(() => {
    // Tyhjennetään taulu jokaisen testin alussa
    db.prepare("DELETE FROM paikat").run();
  });

  describe("GET /api/paikat", () => {
    it("palauttaa tyhjän listan kun paikkoja ei ole", async () => {
      const vastaus = await request(app).get("/api/paikat");

      expect(vastaus.status).toBe(200);
      expect(vastaus.body).toEqual([]);
    });

    it("palauttaa paikan joka on tallennettu", async () => {
      // Lisää paikka suoraan tietokantaan
      const tulos = db
        .prepare(
          "INSERT INTO paikat (kuvaus, lat, lng) VALUES (?, ?, ?) RETURNING *",
        )
        .get("Testi paikka", 60.1699, 24.9384);

      const vastaus = await request(app).get("/api/paikat");

      expect(vastaus.status).toBe(200);
      expect(vastaus.body).toHaveLength(1);
      expect(vastaus.body[0]).toMatchObject({
        kuvaus: "Testi paikka",
        lat: 60.1699,
        lng: 24.9384,
      });
    });

    it("palauttaa paikat järjestyksessä uusin ensin", async () => {
      // Lisää kaksi paikkaa eksplisiitillä luotu-aikaleimoilla
      db.prepare(
        "INSERT INTO paikat (kuvaus, lat, lng, luotu) VALUES (?, ?, ?, ?)",
      ).run("Vanha paikka", 60.1699, 24.9384, "2024-01-01T10:00:00");

      db.prepare(
        "INSERT INTO paikat (kuvaus, lat, lng, luotu) VALUES (?, ?, ?, ?)",
      ).run("Uusi paikka", 60.1699, 24.9384, "2024-01-02T10:00:00");

      const vastaus = await request(app).get("/api/paikat");

      expect(vastaus.status).toBe(200);
      expect(vastaus.body).toHaveLength(2);
      expect(vastaus.body[0].kuvaus).toBe("Uusi paikka");
      expect(vastaus.body[1].kuvaus).toBe("Vanha paikka");
    });
  });

  describe("POST /api/paikat", () => {
    it("luo uuden paikan kelvollisella syötteellä", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          kuvaus: "Uusi paikka",
          lat: 60.1699,
          lng: 24.9384,
        });

      expect(vastaus.status).toBe(201);
      expect(vastaus.body).toMatchObject({
        kuvaus: "Uusi paikka",
        lat: 60.1699,
        lng: 24.9384,
        kuva_tiedosto: null,
      });
      expect(vastaus.body.id).toBeDefined();
      expect(vastaus.body.luotu).toBeDefined();
    });

    it("palauttaa 400 kun kuvaus puuttuu", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          lat: 60.1699,
          lng: 24.9384,
        });

      expect(vastaus.status).toBe(400);
      expect(vastaus.body.error).toBeDefined();
    });

    it("palauttaa 400 kun lat puuttuu", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          kuvaus: "Paikka",
          lng: 24.9384,
        });

      expect(vastaus.status).toBe(400);
      expect(vastaus.body.error).toBeDefined();
    });

    it("palauttaa 400 kun lng puuttuu", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          kuvaus: "Paikka",
          lat: 60.1699,
        });

      expect(vastaus.status).toBe(400);
      expect(vastaus.body.error).toBeDefined();
    });

    it("palauttaa 400 kun lat ei ole numero", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          kuvaus: "Paikka",
          lat: "eikö ole numero",
          lng: 24.9384,
        });

      expect(vastaus.status).toBe(400);
      expect(vastaus.body.error).toBeDefined();
    });

    it("palauttaa 400 kun lng ei ole numero", async () => {
      const vastaus = await request(app)
        .post("/api/paikat")
        .send({
          kuvaus: "Paikka",
          lat: 60.1699,
          lng: "eikö ole numero",
        });

      expect(vastaus.status).toBe(400);
      expect(vastaus.body.error).toBeDefined();
    });
  });

  describe("DELETE /api/paikat/:id", () => {
    it("poistaa paikan jonka id on olemassa", async () => {
      // Lisää paikka
      const tulos = db
        .prepare(
          "INSERT INTO paikat (kuvaus, lat, lng) VALUES (?, ?, ?) RETURNING *",
        )
        .get("Poistettava paikka", 60.1699, 24.9384) as any;

      const vastaus = await request(app).delete(`/api/paikat/${tulos.id}`);

      expect(vastaus.status).toBe(204);

      // Varmista että paikka on poistettu
      const jaljella = db
        .prepare("SELECT COUNT(*) as lkm FROM paikat")
        .get() as any;
      expect(jaljella.lkm).toBe(0);
    });

    it("palauttaa 404 kun id:tä ei löydy", async () => {
      const vastaus = await request(app).delete("/api/paikat/99999");

      expect(vastaus.status).toBe(404);
      expect(vastaus.body.error).toBeDefined();
    });
  });
});
