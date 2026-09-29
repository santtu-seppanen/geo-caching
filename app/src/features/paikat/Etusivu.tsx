import { useState, type FormEvent } from "react";
import type { Alue } from "./alueet";
import { normalisoiAlueNimi } from "./alueet";
import type { LahellaOlevaAlue } from "../etsi/laheisinAlue";
import { ilmansuuntaTekstiksi } from "../etsi/ilmansuunta";
import { Edistymispalkki } from "./Edistymispalkki";

interface EtusivuProps {
  alueet: Alue[];
  lahellaOlevaAlue: LahellaOlevaAlue | null;
  loydettyjaAlueitaKokonaan: number;
  /** Kutsutaan alueen näytettävällä nimellä (ei id:n tekstiosalla), ks. yhdistaSamannimiset. */
  onValitseAlue: (nimi: string) => void;
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
  loydettyjaAlueitaKokonaan,
  onValitseAlue,
}: EtusivuProps) {
  const [haku, setHaku] = useState("");
  const [virhe, setVirhe] = useState<string | null>(null);

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
        <p
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
          {lahellaOlevaAlue.avautuuKartalle ? (
            <button
              type="button"
              className="nappi nappi-ensisijainen"
              onClick={() => onValitseAlue(lahellaOlevaAlue.nimi)}
            >
              Näytä kartalla
            </button>
          ) : (
            <span className="lahella-rivi lahella-vihje">Tule lähemmäs, niin näet alueen kartalla.</span>
          )}
        </p>
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
