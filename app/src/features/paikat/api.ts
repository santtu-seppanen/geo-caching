import type { Paikka } from "./types";

export async function haePaikat(): Promise<Paikka[]> {
  const res = await fetch("/api/paikat");
  if (!res.ok) throw new Error("Paikkojen hakeminen epäonnistui");
  return res.json();
}

export async function tallennaPaikka(input: {
  kuvaus: string;
  lat: number;
  lng: number;
  kuva?: File;
}): Promise<Paikka> {
  const body = new FormData();
  body.set("kuvaus", input.kuvaus);
  body.set("lat", String(input.lat));
  body.set("lng", String(input.lng));
  if (input.kuva) body.set("kuva", input.kuva);

  const res = await fetch("/api/paikat", { method: "POST", body });
  if (!res.ok) throw new Error("Paikan tallennus epäonnistui");
  return res.json();
}

export async function poistaPaikka(id: number): Promise<void> {
  const res = await fetch(`/api/paikat/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Paikan poisto epäonnistui");
}
