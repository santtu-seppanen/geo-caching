import { useEffect } from "react";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";
import { palautettavatEtsinnat } from "./etsinnanPalautus";
import { haeKaynnissaOlevatEtsinnat } from "./etsinnatApi";
import { lataaEtsinnanAlku, tallennaEtsinnanAlku } from "./pelitila";

const TARKISTUS_VALI_MS = 60_000;

/**
 * Ottaa käyttöön nimimerkin muilla laitteilla aloittamat käynnissä olevat
 * etsinnät: haetaan palvelimen etsinnät (/etsinnat, jonne aloitus ilmoitetaan
 * jo tilannekuvaa varten) ja tallennetaan laitteelle ne, jotka ovat uudempia
 * kuin laitteen oma aloitus. Ajetaan käynnistyessä, nimimerkin tallennuksen
 * (`laukaisin` muuttuu), välilehden palatessa näkyviin ja minuutin välein.
 * `onPalautettu` kutsutaan vain kun jokin etsintä todella palautui.
 * Verkkovirhe ohitetaan hiljaa — pelin tila asuu silti laitteella.
 */
export function useEtsinnanPalautus(laukaisin: number, onPalautettu: () => void): void {
  useEffect(() => {
    let peruttu = false;

    async function palauta() {
      const nimi = haePelaajanNimi();
      if (!nimi.trim()) return;
      try {
        const palautettavat = palautettavatEtsinnat(
          await haeKaynnissaOlevatEtsinnat(),
          nimi,
          lataaEtsinnanAlku,
          Date.now(),
        );
        if (peruttu || palautettavat.length === 0) return;
        for (const { alueAvain, alkoi } of palautettavat) tallennaEtsinnanAlku(alueAvain, alkoi);
        onPalautettu();
      } catch {
        // Ei verkkoa tai palvelinvirhe — yritetään uudelleen seuraavalla kerralla.
      }
    }

    void palauta();
    const ajastin = setInterval(palauta, TARKISTUS_VALI_MS);
    const nakyviin = () => document.visibilityState === "visible" && void palauta();
    document.addEventListener("visibilitychange", nakyviin);
    return () => {
      peruttu = true;
      clearInterval(ajastin);
      document.removeEventListener("visibilitychange", nakyviin);
    };
  }, [laukaisin, onPalautettu]);
}
