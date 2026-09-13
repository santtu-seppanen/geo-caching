import { useState, type FormEvent } from "react";
import type { Alue } from "./alueet";

interface EtusivuProps {
  alueet: Alue[];
  onValitseAlue: (alue: string) => void;
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

export function Etusivu({ alueet, onValitseAlue }: EtusivuProps) {
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
