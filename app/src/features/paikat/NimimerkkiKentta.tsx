import { useState } from "react";
import type { FormEvent } from "react";
import { haePelaajanNimi, tallennaPelaajanNimi } from "../../lib/pelaajanNimi";

interface NimimerkkiKenttaProps {
  onTallennettu: () => void;
}

/**
 * Nimimerkin asetus etusivulla. Samalla nimimerkillä käynnissä oleva etsintä
 * jatkuu toisella laitteella (ks. useEtsinnanPalautus) — nimimerkki muuten
 * asetetaan vasta ensimmäisen löydön yhteydessä.
 */
export function NimimerkkiKentta({ onTallennettu }: NimimerkkiKenttaProps) {
  const [nimi, setNimi] = useState(() => haePelaajanNimi());
  const [tallennettu, setTallennettu] = useState(false);

  function tallenna(e: FormEvent) {
    e.preventDefault();
    const siisti = nimi.trim();
    if (!siisti) return;
    tallennaPelaajanNimi(siisti);
    setNimi(siisti);
    setTallennettu(true);
    onTallennettu();
  }

  return (
    <form className="aluehaku-lomake nimimerkki-lomake" onSubmit={tallenna}>
      <input
        type="text"
        className="teksti-syote"
        value={nimi}
        onChange={(e) => {
          setNimi(e.target.value);
          setTallennettu(false);
        }}
        placeholder="Nimimerkkisi"
        aria-label="Nimimerkki"
        maxLength={50}
      />
      <button type="submit" className="nappi nappi-toissijainen" disabled={!nimi.trim()}>
        {tallennettu ? "Tallennettu ✓" : "Tallenna"}
      </button>
      <p className="aluehaku-lisatieto">
        Samalla nimimerkillä jatkat käynnissä olevaa etsintää toisella laitteella.
      </p>
    </form>
  );
}
