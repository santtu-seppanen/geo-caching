import { normalisoiAlueNimi } from "../paikat/alueet";
import { OLETUS_PELIMOODI, onPelimoodi, type Pelimoodi } from "./pelimoodit";

/** Alueiden pelimoodit normalisoidun alue-nimen mukaan (ks. normalisoiAlueNimi). */
export type AlueidenPelimoodit = ReadonlyMap<string, Pelimoodi>;

export async function haeAlueidenPelimoodit(): Promise<AlueidenPelimoodit> {
  const url = `${import.meta.env.VITE_LOYTO_API_URL}/alueet`;

  const vastaus = await fetch(url);

  if (!vastaus.ok) {
    throw new Error("Alueiden pelimoodien haku epäonnistui");
  }

  const rivit = (await vastaus.json()) as { alueAvain: string; pelimoodi: string }[];
  return new Map(
    rivit.filter((rivi) => onPelimoodi(rivi.pelimoodi)).map((rivi) => [rivi.alueAvain, rivi.pelimoodi as Pelimoodi]),
  );
}

export function alueenPelimoodi(pelimoodit: AlueidenPelimoodit, alueenNimi: string): Pelimoodi {
  return pelimoodit.get(normalisoiAlueNimi(alueenNimi)) ?? OLETUS_PELIMOODI;
}
