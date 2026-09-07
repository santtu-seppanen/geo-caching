import { useEffect, useRef, useState } from "react";
import { seuraaSijaintia, type Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina } from "./distance";
import type { Paikka } from "../paikat/types";

const HALYTYSKYNNYS_METREINA = 100;

export interface LahellaOlevaPaikka {
  paikka: Paikka;
  etaisyysMetreina: number;
}

/**
 * Palauttaa nykyisen sijainnin sekä paikat, jotka ovat hälytyskynnyksen
 * sisällä. Hälyttää kustakin paikasta korkeintaan kerran per "lähestyminen"
 * (poistuu kynnyksen ulkopuolelle ja palaa takaisin), jotta samasta
 * paikasta ei tulvi toistuvia hälytyksiä käyttäjän seistessä sen vierellä.
 */
export function useNearbyAlert(
  paikat: Paikka[],
  onHalytys: (lahella: LahellaOlevaPaikka) => void,
) {
  const [sijainti, setSijainti] = useState<Sijainti | null>(null);
  const halytetytIdt = useRef(new Set<number>());

  useEffect(() => {
    return seuraaSijaintia(setSijainti, () => {});
  }, []);

  useEffect(() => {
    if (!sijainti) return;

    for (const paikka of paikat) {
      const etaisyys = etaisyysMetreina(sijainti, paikka);
      const onLahella = etaisyys <= HALYTYSKYNNYS_METREINA;

      if (onLahella && !halytetytIdt.current.has(paikka.id)) {
        halytetytIdt.current.add(paikka.id);
        onHalytys({ paikka, etaisyysMetreina: etaisyys });
      } else if (!onLahella) {
        halytetytIdt.current.delete(paikka.id);
      }
    }
  }, [sijainti, paikat, onHalytys]);

  return { sijainti };
}
