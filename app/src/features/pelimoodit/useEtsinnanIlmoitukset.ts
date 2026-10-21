import { useEffect } from "react";
import { etsinnanIlmoitus, type EtsinnanIlmoitus } from "./etsinnanIlmoitus";
import { lataaKaikkiEtsinnat } from "./pelitila";

const TARKISTUS_VALI_MS = 15_000;

/**
 * Tarkistaa säännöllisesti kaikki laitteella käynnissä olevat etsinnät ja
 * kutsuu `onIlmoitus`, kun 15 min varoitus- tai takaraja ylittyy. Sovelluksen
 * ollessa kiinni ilmoitus ei ole mahdollinen (ei push-palvelinta).
 */
export function useEtsinnanIlmoitukset(
  onIlmoitus: (alueAvain: string, ilmoitus: EtsinnanIlmoitus) => void,
): void {
  useEffect(() => {
    let edellinenNyt = Date.now();
    const tarkista = () => {
      const nyt = Date.now();
      for (const { alueAvain, alkoi } of lataaKaikkiEtsinnat()) {
        const ilmoitus = etsinnanIlmoitus(alkoi, edellinenNyt, nyt);
        if (ilmoitus) onIlmoitus(alueAvain, ilmoitus);
      }
      edellinenNyt = nyt;
    };
    const ajastin = setInterval(tarkista, TARKISTUS_VALI_MS);
    // Taustalta palatessa selain on voinut jäädyttää ajastimen — tarkistetaan heti.
    document.addEventListener("visibilitychange", tarkista);
    return () => {
      clearInterval(ajastin);
      document.removeEventListener("visibilitychange", tarkista);
    };
  }, [onIlmoitus]);
}
