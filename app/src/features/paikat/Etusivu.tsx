import { useState, type FormEvent } from "react";
import type { Alue } from "./alueet";
import { normalisoiAlueNimi } from "./alueet";
import type { LahellaOlevaAlue } from "../etsi/laheisinAlue";
import { ilmansuuntaTekstiksi } from "../etsi/ilmansuunta";
import { Edistymispalkki } from "./Edistymispalkki";
import { PELIMOODIN_NIMI } from "../pelimoodit/pelimoodit";
import { alueenPelimoodi, type AlueidenPelimoodit } from "../pelimoodit/pelimoodiApi";
import { lataaEtsinnanAlku } from "../pelimoodit/pelitila";
import { etsintaKaynnissa } from "../pelimoodit/etsinta";

interface EtusivuProps {
  alueet: Alue[];
  lahellaOlevaAlue: LahellaOlevaAlue | null;
  /** ALUE_AVAUTUU_METREINA-säteellä olevat alueet lähimmästä alkaen, ks. etsiLahellaOlevatAlueet. */
  lahellaOlevatAlueet: LahellaOlevaAlue[];
  pelimoodit: AlueidenPelimoodit;
  loydettyjaAlueitaKokonaan: number;
  /** Kutsutaan alueen näytettävällä nimellä (ei id:n tekstiosalla), ks. yhdistaSamannimiset. */
  onValitseAlue: (nimi: string) => void;
  /** Kuten onValitseAlue, mutta aloittaa samalla alueen etsinnän (ks. tallennaEtsinnanAlku). */
  onAloitaEtsinta: (nimi: string) => void;
}

/** Muotoilee etäisyyden ihmisluettavaksi: metrit alle kilometrin, muuten kilometrit yhden desimaalin tarkkuudella. */
function muotoileEtaisyys(etaisyysMetreina: number): string {
  if (etaisyysMetreina < 1000) {
    return `${Math.round(etaisyysMetreina / 10) * 10} m`;
  }
  return `${(etaisyysMetreina / 1000).toFixed(1)} km`;
}

export function Etusivu({
  alueet,
  lahellaOlevaAlue,
  lahellaOlevatAlueet,
  pelimoodit,
  loydettyjaAlueitaKokonaan,
  onValitseAlue,
  onAloitaEtsinta,
}: EtusivuProps) {
  const [haku, setHaku] = useState("");
  const [virhe, setVirhe] = useState<string | null>(null);
  // Valinta muistetaan nimellä, ja jos alue putoaa listalta (käyttäjä liikkuu), palataan lähimpään.
  const [valittuNimi, setValittuNimi] = useState<string | null>(null);
  const valittu =
    lahellaOlevatAlueet.find((alue) => alue.nimi === valittuNimi) ?? lahellaOlevatAlueet[0] ?? null;
  const valitunEtsintaKaynnissa =
    valittu !== null && etsintaKaynnissa(lataaEtsinnanAlku(normalisoiAlueNimi(valittu.nimi)), Date.now());

  function hae(e: FormEvent) {
    e.preventDefault();
    const normalisoitu = normalisoiAlueNimi(haku);
    if (!normalisoitu) return;

    const loytyi = alueet.find((alue) => normalisoiAlueNimi(alue.nimi) === normalisoitu);
    if (loytyi) {
      setVirhe(null);
      onValitseAlue(loytyi.nimi);
    } else {
      setVirhe("Kätköjä ei löytynyt annetulta alueelta.");
    }
  }

  return (
    <section className="aluehaku">
      {lahellaOlevaAlue && (
        <div
          className={
            "lahella-huomautus" + (lahellaOlevaAlue.avautuuKartalle ? "" : " lahella-huomautus-kaukana")
          }
          role="status"
        >
          <span
            className="suunta-nuoli"
            style={{ transform: `rotate(${lahellaOlevaAlue.suuntimaAsteina}deg)` }}
            aria-hidden="true"
          >
            ↑
          </span>
          <span className="lahella-rivi">
            {lahellaOlevaAlue.avautuuKartalle ? "Kätkö lähellä!" : "Lähin alue"}
          </span>
          <span className="lahella-rivi">
            Olet noin {muotoileEtaisyys(lahellaOlevaAlue.etaisyysMetreina)} alueesta{" "}
            <strong>{lahellaOlevaAlue.nimi}</strong>.
          </span>
          <span className="lahella-rivi">
            Suuntaa {ilmansuuntaTekstiksi(lahellaOlevaAlue.suuntimaAsteina)}.
          </span>
          {lahellaOlevaAlue.avautuuKartalle && valittu ? (
            <>
              {lahellaOlevatAlueet.length > 1 && (
                <label className="lahella-valinta">
                  <span className="lahella-rivi">Lähellä on {lahellaOlevatAlueet.length} aluetta:</span>
                  <select
                    className="teksti-syote"
                    value={valittu.nimi}
                    onChange={(e) => setValittuNimi(e.target.value)}
                  >
                    {lahellaOlevatAlueet.map((alue) => (
                      <option key={alue.nimi} value={alue.nimi}>
                        {alue.nimi} ({muotoileEtaisyys(alue.etaisyysMetreina)})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className="lahella-rivi lahella-vihje">
                Pelimoodi: {PELIMOODIN_NIMI[alueenPelimoodi(pelimoodit, valittu.nimi)]}
              </span>
              {valitunEtsintaKaynnissa ? (
                <button
                  type="button"
                  className="nappi nappi-ensisijainen"
                  onClick={() => onValitseAlue(valittu.nimi)}
                >
                  Jatka etsintää
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="nappi nappi-ensisijainen"
                    onClick={() => onAloitaEtsinta(valittu.nimi)}
                  >
                    Aloita etsintä
                  </button>
                  <button
                    type="button"
                    className="nappi nappi-toissijainen"
                    onClick={() => onValitseAlue(valittu.nimi)}
                  >
                    Näytä kartalla
                  </button>
                </>
              )}
            </>
          ) : (
            <span className="lahella-rivi lahella-vihje">Tule lähemmäs, niin näet alueen kartalla.</span>
          )}
        </div>
      )}
      <div className="aluehaku-kortti">
        <h2>Etsi kätköjä</h2>
        <Edistymispalkki
          loydetty={loydettyjaAlueitaKokonaan}
          yhteensa={alueet.length}
          teksti="aluetta löydetty kokonaan"
        />
        <p className="aluehaku-ohje">
          <strong>Sinun täytyy tietää kätköalueen nimi tai olla sitä lähellä.</strong>
        </p>
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
        <p className="aluehaku-lisatieto">
          Kätköalue on vapaasti valittava nimi, se voi olla myös paikannimi.
        </p>
        {virhe && (
          <p className="vihje-tooltip" role="alert">
            {virhe}
          </p>
        )}
      </div>
    </section>
  );
}
