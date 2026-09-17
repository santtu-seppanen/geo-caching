import type { Loyto, Paikka } from "../paikat/types";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";
import { yhdistaLoydot, laskePistetaulu, laskeOmatLoydot } from "./tilastoLaskenta";

interface TilastotProps {
  paikat: Paikka[];
  loydot: Loyto[];
  omatLoydot: Loyto[];
  onSulje: () => void;
}

export function Tilastot({ paikat, loydot, omatLoydot, onSulje }: TilastotProps) {
  const kaikkiLoydot = yhdistaLoydot(loydot, omatLoydot);
  const pistetaulu = laskePistetaulu(kaikkiLoydot);
  const omaNimi = haePelaajanNimi();
  const omatLoydotAikajarjestyksessa = laskeOmatLoydot(kaikkiLoydot, paikat, omaNimi);

  return (
    <section className="admin-lomake-kontti">
      <button type="button" className="nappi nappi-toissijainen sulje-nappi" onClick={onSulje}>
        Sulje
      </button>

      <h2>Tilastot</h2>

      <div className="tilastot-osio">
        <h3>Löytäjät</h3>
        {pistetaulu.length === 0 ? (
          <p className="tyhja-tila">Ei vielä löytöjä.</p>
        ) : (
          <ol className="pistetaulu">
            {pistetaulu.map((rivi, indeksi) => (
              <li key={rivi.nimi} className="pistetaulu-rivi">
                <span className="pistetaulu-sija">{indeksi + 1}.</span>
                <span className="pistetaulu-nimi">{rivi.nimi}</span>
                <span className="pistetaulu-maara">{rivi.maara}</span>
              </li>
            ))}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
