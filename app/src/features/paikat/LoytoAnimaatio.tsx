import { useEffect, useState } from "react";
import { Modaali } from "../../lib/Modaali";
import { muotoileKesto } from "../../lib/kesto";
import { MITALI_EMOJI, type Mitali } from "../tilastot/tilastoLaskenta";

/** Yhden ruudun kesto — kolme ruutua, jonka jälkeen animaatio sulkeutuu itsestään. */
const RUUDUN_KESTO_MS = 1500;
const RUUTUJA = 3;

interface LoytoAnimaatioProps {
  nimi: string;
  mitali: Mitali | undefined;
  kestoMs: number | null;
  onSulje: () => void;
}

/**
 * Välianimaatio löydön jälkeen, sama muotokieli kuin säännöt-sarjakuvassa
 * (ks. Saannot.tsx): keltainen otsikkolaatikko, paksu musta kehys ja
 * puhekupla. Kolme ruutua ilmestyy peräkkäin; napautus ohittaa.
 */
export function LoytoAnimaatio({ nimi, mitali, kestoMs, onSulje }: LoytoAnimaatioProps) {
  const [ruutu, setRuutu] = useState(1);

  useEffect(() => {
    navigator.vibrate?.([60, 40, 120]);
  }, []);

  useEffect(() => {
    const ajastin = setTimeout(
      () => (ruutu < RUUTUJA ? setRuutu(ruutu + 1) : onSulje()),
      RUUDUN_KESTO_MS,
    );
    return () => clearTimeout(ajastin);
  }, [ruutu, onSulje]);

  return (
    <Modaali onSulje={onSulje} sisallonLuokka="modaali-sisalto-sarjakuva">
      <button type="button" className={`loyto-sarjakuva${mitali ? ` loyto-${mitali}` : ""}`} onClick={onSulje} aria-label="Ohita animaatio">
        <div className="loyto-otsikko">
          {mitali === "kulta" ? "ENSIMMÄINEN LÖYTÄJÄ!" : "KÄTKÖ LÖYDETTY!"}
        </div>

        <div className="loyto-ruudut" role="status">
          <div className="loyto-ruutu loyto-ruutu-1">
            <span className="loyto-pullo" aria-hidden="true">🍾</span>
            <span className="loyto-sivuaani">Hetkinen…</span>
          </div>
          {ruutu >= 2 && (
            <div className="loyto-ruutu loyto-ruutu-2">
              <span className="loyto-rajahdys" aria-hidden="true">
                <span>{mitali === "kulta" ? "KULTAA!" : "LÖYTYI!"}</span>
              </span>
            </div>
          )}
          {ruutu >= 3 && (
            <div className="loyto-ruutu loyto-ruutu-3">
              <span className="loyto-kupla">
                Ja näin: LÖYDETTY! Nimimerkki: {nimi}.
                {kestoMs != null && <> Aika: ⏱ {muotoileKesto(kestoMs)}</>}
              </span>
              {mitali && (
                <span className="loyto-mitali" aria-label={`Mitali: ${mitali}`}>
                  {MITALI_EMOJI[mitali]}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
    </Modaali>
  );
}
