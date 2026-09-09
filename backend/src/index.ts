import express from "express";
import path from "node:path";
import { paikatRouter } from "./routes/paikat.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());
app.use("/uploads", express.static(path.resolve(import.meta.dirname, "../uploads")));
app.use("/api/paikat", paikatRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Kuuntele porttia vain jos tämä ei ole testi-ympäristö
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`backend kuuntelee portissa ${port}`);
  });
}

export { app };
