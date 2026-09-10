import { useEffect, useRef, useState } from "react";
import { seuraaSijaintia, type Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina } from "./distance";
import { KATKO_AVAUTUU_METREINA } from "./kynnykset";
import type { Paikka } from "../paikat/types";

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
  const halytetytIdt = useRef(new Set<string>());

  useEffect(() => {
    return seuraaSijaintia(setSijainti, () => {});
  }, []);

  useEffect(() => {
    if (!sijainti) return;

    for (const paikka of paikat) {
      const etaisyys = etaisyysMetreina(sijainti, paikka);
      const onLahella = etaisyys <= KATKO_AVAUTUU_METREINA;

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
