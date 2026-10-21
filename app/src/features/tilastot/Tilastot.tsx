import { useState } from "react";
import type { Loyto, Paikka } from "../paikat/types";
import { ryhmitteleAlueiksi, yhdistaKaikkiSamannimiset } from "../paikat/alueet";
import type { AlueidenPelimoodit } from "../pelimoodit/pelimoodiApi";
import { laskeOhitukset } from "../pelimoodit/ohitukset";
import { lataaEtsinnanAlku } from "../pelimoodit/pelitila";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";
import { muotoileKesto } from "../../lib/kesto";
import {
  yhdistaLoydot,
  laskePistetaulu,
  laskeOmatLoydot,
  laskeMitaliMaaratNimittain,
  MITALI_EMOJI,
} from "./tilastoLaskenta";

interface TilastotProps {
  paikat: Paikka[];
  pelimoodit: AlueidenPelimoodit;
  loydot: Loyto[];
  omatLoydot: Loyto[];
  onSulje: () => void;
}

export function Tilastot({ paikat, pelimoodit, loydot, omatLoydot, onSulje }: TilastotProps) {
  const [laajennettuNimi, setLaajennettuNimi] = useState<string | null>(null);

  const kaikkiLoydot = yhdistaLoydot(loydot, omatLoydot);
  const pistetaulu = laskePistetaulu(kaikkiLoydot);
  const mitalit = laskeMitaliMaaratNimittain(kaikkiLoydot);
  const omaNimi = haePelaajanNimi();
  const ohitukset = laskeOhitukset(
    yhdistaKaikkiSamannimiset(ryhmitteleAlueiksi(paikat)),
    pelimoodit,
    kaikkiLoydot,
    omaNimi,
    lataaEtsinnanAlku,
    Date.now(),
  );
  const omatLoydotAikajarjestyksessa = laskeOmatLoydot(kaikkiLoydot, paikat, omaNimi);

  return (
    <section className="admin-lomake-kontti">
      <button type="button" className="nappi nappi-toissijainen sulje-nappi" onClick={onSulje}>
        Sulje
      </button>

      <h2>Tilastot</h2>

      {ohitukset.length > 0 && (
        <div className="tilastot-osio">
          <h3>Ohitetut kätköt</h3>
          <ul className="ohitukset-lista">
            {ohitukset.map((o) => (
              <li key={o.alue}>
                {o.alue}: ohitettu {o.ohitettu} / {o.yhteensa} kätköä tässä etsinnässä
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tilastot-osio">
        <h3>Löytäjät</h3>
        {pistetaulu.length === 0 ? (
          <p className="tyhja-tila">Ei vielä löytöjä.</p>
        ) : (
          <ol className="pistetaulu">
            {pistetaulu.map((rivi, indeksi) => {
              const rivinMitalit = mitalit.get(rivi.nimi) ?? { kulta: 0, hopea: 0, pronssi: 0 };
              const onLaajennettu = laajennettuNimi === rivi.nimi;
              return (
                <li key={rivi.nimi} className="pistetaulu-rivi">
                  <button
                    type="button"
                    className="pistetaulu-rivi-nappi"
                    onClick={() => setLaajennettuNimi(onLaajennettu ? null : rivi.nimi)}
                    aria-expanded={onLaajennettu}
                  >
                    <span className="pistetaulu-sija">{indeksi + 1}.</span>
                    <span className="pistetaulu-nimi">{rivi.nimi}</span>
                    <span className="pistetaulu-maara">{rivi.maara}</span>
                  </button>
                  {onLaajennettu && (
                    <p className="pistetaulu-mitalit">
                      <span>
                        {MITALI_EMOJI.kulta} {rivinMitalit.kulta}
                      </span>
                      <span>
                        {MITALI_EMOJI.hopea} {rivinMitalit.hopea}
                      </span>
                      <span>
                        {MITALI_EMOJI.pronssi} {rivinMitalit.pronssi}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="tilastot-osio">
        <h3>Omat löydöt</h3>
        {!omaNimi.trim() ? (
          <p className="tyhja-tila">Merkitse ensin löytö, niin näet tässä oman historiasi.</p>
        ) : omatLoydotAikajarjestyksessa.length === 0 ? (
          <p className="tyhja-tila">Ei vielä löytöjä nimimerkillä “{omaNimi}”.</p>
        ) : (
          <ul className="omat-loydot-lista">
            {omatLoydotAikajarjestyksessa.map((rivi) => (
              <li key={`${rivi.paikkaId}-${rivi.aika}`} className="omat-loydot-rivi">
                <span className="omat-loydot-alue">{rivi.alue}</span>
                <span className="omat-loydot-kuvaus">{rivi.kuvaus}</span>
                <span className="omat-loydot-aika">
                  {new Date(rivi.aika).toLocaleDateString("fi-FI")}
                </span>
                <span className="omat-loydot-aika" title="Löytöaika edellisestä löydöstä tai etsinnän aloituksesta">
                  ⏱ {rivi.kestoMs != null ? muotoileKesto(rivi.kestoMs) : "N/A"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
