import { useEffect, useRef } from "react";
import type { Sijainti } from "../../lib/geolocation";
import { etsintaKaynnissa } from "./etsinta";
import { ilmoitaEtsinnanSijainti } from "./etsinnatApi";
import { lataaEtsinnanAlku } from "./pelitila";

/** Kuinka usein sijainti lähetetään tilannekuvaan etsinnän aikana. */
export const SIJAINNIN_JAKO_MS = 15_000;
/** Vanhempaa (esim. välimuistista tullutta) sijaintia ei lähetetä tuoreena. */
const SIJAINTI_MAX_IKA_MS = 2 * 60_000;

/**
 * Jakaa pelaajan sijainnin tilannekuvaan (/tilannekuva) niiltä alueilta,
 * joilla hänen etsintänsä on käynnissä — ei koskaan ilman etsintää. Toimii
 * vain sovelluksen ollessa auki, kuten sijainnin seuranta muutenkin.
 */
export function useSijainninJako(sijainti: Sijainti | null, alueAvaimet: string[]): void {
  const sijaintiRef = useRef(sijainti);
  sijaintiRef.current = sijainti;
  const avaimetRef = useRef(alueAvaimet);
  avaimetRef.current = alueAvaimet;

  useEffect(() => {
    function jaa() {
      const nyt = Date.now();
      const nykyinen = sijaintiRef.current;
      if (!nykyinen || nyt - nykyinen.aikaleima > SIJAINTI_MAX_IKA_MS) return;
      for (const avain of avaimetRef.current) {
        if (etsintaKaynnissa(lataaEtsinnanAlku(avain), nyt)) ilmoitaEtsinnanSijainti(avain, nykyinen);
      }
    }

    const ajastin = setInterval(jaa, SIJAINNIN_JAKO_MS);
    return () => clearInterval(ajastin);
  }, []);
}
