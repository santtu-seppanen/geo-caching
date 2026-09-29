import { useEffect, useRef, useState } from "react";
import { PULLON_KOOT, pullonKokoNimi } from "../paikat/pullonKoko";
import { PullonKokoIkoni } from "../paikat/PullonKokoIkoni";

interface PullonKokoValitsinProps {
  arvo: number | null;
  onValitse: (ml: number | null) => void;
}

/**
 * Kätkön pullon koon valikko admin-lomakkeella. Oma pudotusvalikko natiivin
 * <select>:in sijaan, koska vaihtoehdot näytetään pullon kokoa kuvaavalla
 * ikonilla eikä pelkkänä tekstinä — <option>-elementit eivät voi sisältää
 * muuta kuin tekstiä. Tieto on valinnainen (ks. CLAUDE.md), joten valikossa
 * on aina myös "Ei tiedossa" -vaihtoehto.
 */
export function PullonKokoValitsin({ arvo, onValitse }: PullonKokoValitsinProps) {
  const [auki, setAuki] = useState(false);
  const kontti = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auki) return;

    function sulje(e: MouseEvent) {
      if (kontti.current && !kontti.current.contains(e.target as Node)) {
        setAuki(false);
      }
    }

    document.addEventListener("mousedown", sulje);
    return () => document.removeEventListener("mousedown", sulje);
  }, [auki]);

  function valitse(ml: number | null) {
    onValitse(ml);
    setAuki(false);
  }

  return (
    <div className="pullon-koko-valitsin" ref={kontti}>
      <button
        type="button"
        className="pullon-koko-nappi"
        onClick={() => setAuki((edellinen) => !edellinen)}
        aria-haspopup="listbox"
        aria-expanded={auki}
      >
        <PullonKokoIkoni ml={arvo} />
        <span>{arvo !== null ? `${pullonKokoNimi(arvo)} (${arvo} ml)` : "Ei tiedossa"}</span>
        <span className={"pullon-koko-nuoli" + (auki ? " pullon-koko-nuoli-auki" : "")} aria-hidden="true" />
      </button>

      {auki && (
        <ul className="pullon-koko-lista" role="listbox">
          <li role="option" aria-selected={arvo === null}>
            <button type="button" onClick={() => valitse(null)}>
              <PullonKokoIkoni ml={null} />
              <span>Ei tiedossa</span>
            </button>
          </li>
          {PULLON_KOOT.map((koko) => (
            <li key={koko.ml} role="option" aria-selected={arvo === koko.ml}>
              <button type="button" onClick={() => valitse(koko.ml)}>
                <PullonKokoIkoni ml={koko.ml} />
                <span>
                  {koko.nimi} ({koko.ml} ml)
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
