import type { Alue } from "./alueet";
import type { Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina, etenemisprosentti } from "../etsi/distance";
import { ALUE_AVAUTUU_METREINA, ALUE_TUTKA_METREINA } from "../etsi/kynnykset";

interface EtusivuProps {
  alueet: Alue[];
  sijainti: Sijainti | null;
  onValitseAlue: (alue: string) => void;
}

export function Etusivu({ alueet, sijainti, onValitseAlue }: EtusivuProps) {
  return (
    <section className="aluelista">
      <h2>Alueet</h2>
      {!sijainti && <p className="tyhja-tila">Haetaan sijaintia…</p>}
      <ul className="alueet">
        {alueet.map((alue) => {
          const etaisyys = sijainti ? etaisyysMetreina(sijainti, alue.keskipiste) : null;
          const avoinna = etaisyys !== null && etaisyys <= ALUE_AVAUTUU_METREINA;
          const etenema =
            etaisyys !== null
              ? etenemisprosentti(etaisyys, ALUE_AVAUTUU_METREINA, ALUE_TUTKA_METREINA)
              : 0;

          const sisalto = (
            <>
              <span className="alue-nimi">{alue.alue}</span>
              <span className="alue-etaisyys">
                {etaisyys !== null ? `${Math.round(etaisyys)} m` : "…"}
              </span>
              {sijainti && (
                <span
                  className="alue-edistyminen"
                  role="progressbar"
                  aria-label={`Etäisyys alueeseen ${alue.alue}`}
                  aria-valuenow={Math.round(etenema * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className="alue-edistyminen-tayte"
                    style={{ width: `${etenema * 100}%` }}
                  />
                </span>
              )}
              <span className="alue-vihje">{alue.alueVihje}</span>
            </>
          );

          return (
            <li key={alue.alue} className={`alue-rivi ${avoinna ? "avoinna" : "lukittu"}`}>
              {avoinna ? (
                <button
                  type="button"
                  className="alue-linkki"
                  onClick={() => onValitseAlue(alue.alue)}
                >
                  {sisalto}
                </button>
              ) : (
                <div className="alue-linkki alue-linkki-poissa">{sisalto}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
