import { useState, type FormEvent } from "react";
import type { Alue } from "./alueet";
import type { LahellaOlevaAlue } from "../etsi/laheisinAlue";

interface EtusivuProps {
  alueet: Alue[];
  lahellaOlevaAlue: LahellaOlevaAlue | null;
  onValitseAlue: (alue: string) => void;
}

/** Muotoilee etäisyyden ihmisluettavaksi: metrit alle kilometrin, muuten kilometrit yhden desimaalin tarkkuudella. */
function muotoileEtaisyys(etaisyysMetreina: number): string {
  if (etaisyysMetreina < 1000) {
    return `${Math.round(etaisyysMetreina / 10) * 10} m`;
  }
  return `${(etaisyysMetreina / 1000).toFixed(1)} km`;
}

/**
 * Sallii kirjoitusasun vaihtelun (esim. "Neittävä" vs. id:n tekstiosa
 * "neittava", koska kätkön id sallii vain a-z0-9-merkit).
 */
function normalisoiHaku(teksti: string): string {
  return teksti
    .trim()
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/å/g, "a");
}

export function Etusivu({ alueet, lahellaOlevaAlue, onValitseAlue }: EtusivuProps) {
  const [haku, setHaku] = useState("");
  const [virhe, setVirhe] = useState<string | null>(null);

  function hae(e: FormEvent) {
    e.preventDefault();
    const normalisoitu = normalisoiHaku(haku);
    if (!normalisoitu) return;

    const loytyi = alueet.find((alue) => normalisoiHaku(alue.alue) === normalisoitu);
    if (loytyi) {
      setVirhe(null);
      onValitseAlue(loytyi.alue);
    } else {
      setVirhe("Aluetta ei löytynyt. Tarkista kirjoitusasu.");
    }
  }

  return (
    <section className="aluehaku">
      {lahellaOlevaAlue && (
        <p className="lahella-huomautus" role="status">
          Kätkö lähellä! Olet noin {muotoileEtaisyys(lahellaOlevaAlue.etaisyysMetreina)} alueesta{" "}
          <strong>
            {lahellaOlevaAlue.alue.charAt(0).toUpperCase() + lahellaOlevaAlue.alue.slice(1)}
          </strong>
          .
          <button
            type="button"
            className="nappi nappi-ensisijainen"
            onClick={() => onValitseAlue(lahellaOlevaAlue.alue)}
          >
            Näytä kartalla
          </button>
        </p>
      )}
      <h2>Etsi kätköjä</h2>
      <p className="aluehaku-ohje">Kirjoita alueen nimi, niin näet sen kätköt kartalla.</p>
      <form className="aluehaku-lomake" onSubmit={hae}>
        <input
          type="text"
          className="teksti-syote"
          value={haku}
          onChange={(e) => {
            setHaku(e.target.value);
            setVirhe(null);
          }}
          placeholder="esim. Neittävä"
          aria-label="Alueen nimi"
        />
        <button type="submit" className="nappi nappi-ensisijainen">
          Näytä kartalla
        </button>
      </form>
      {virhe && (
        <p className="vihje-tooltip" role="alert">
          {virhe}
        </p>
      )}
    </section>
  );
}
