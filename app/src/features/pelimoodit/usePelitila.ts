import { useCallback, useEffect, useState } from "react";
import { lataaPelitila, tallennaPelitila, TYHJA_PELITILA, type Mittaus, type Pelitila } from "./pelitila";

/** Kätkön etsintätila (ks. pelitila.ts), tai tyhjä tila kun paikkaId on null. */
export function usePelitila(paikkaId: string | null) {
  const [tila, setTila] = useState<Pelitila>(() =>
    paikkaId ? lataaPelitila(paikkaId) : TYHJA_PELITILA,
  );

  useEffect(() => {
    setTila(paikkaId ? lataaPelitila(paikkaId) : TYHJA_PELITILA);
  }, [paikkaId]);

  const paivita = useCallback(
    (muutos: (edellinen: Pelitila) => Pelitila) => {
      if (!paikkaId) return;
      setTila((edellinen) => {
        const uusi = muutos(edellinen);
        tallennaPelitila(paikkaId, uusi);
        return uusi;
      });
    },
    [paikkaId],
  );

  const kaynnistaAjastin = useCallback(
    () => paivita((edellinen) => (edellinen.alkoi === null ? { ...edellinen, alkoi: Date.now() } : edellinen)),
    [paivita],
  );

  const lisaaMittaus = useCallback(
    (mittaus: Mittaus) =>
      paivita((edellinen) => ({ ...edellinen, mittaukset: [...edellinen.mittaukset, mittaus] })),
    [paivita],
  );

  return { tila, kaynnistaAjastin, lisaaMittaus };
}

/** Nykyhetki, päivittyy `valiMs` välein — vihjeiden ja mittausten lähtölaskentaa varten. */
export function useNyt(valiMs: number, kaynnissa: boolean): number {
  const [nyt, setNyt] = useState(() => Date.now());

  useEffect(() => {
    if (!kaynnissa) return;
    setNyt(Date.now());
    const ajastin = setInterval(() => setNyt(Date.now()), valiMs);
    return () => clearInterval(ajastin);
  }, [valiMs, kaynnissa]);

  return nyt;
}
