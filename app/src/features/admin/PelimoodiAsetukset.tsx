import { useEffect, useMemo, useState } from "react";
import type { Paikka } from "../paikat/types";
import {
  normalisoiAlueNimi,
  ryhmitteleAlueiksi,
  yhdistaKaikkiSamannimiset,
} from "../paikat/alueet";
import {
  PELIMOODIN_KUVAUS,
  PELIMOODIN_NIMI,
  PELIMOODIT,
  onPelimoodi,
} from "../pelimoodit/pelimoodit";
import {
  alueenPelimoodi,
  haeAlueidenPelimoodit,
  type AlueidenPelimoodit,
} from "../pelimoodit/pelimoodiApi";
import { asetaPelimoodi, type AdminTunnus } from "./adminApi";

interface PelimoodiAsetuksetProps {
  paikat: Paikka[];
  tunnus: AdminTunnus;
}

/** Admin valitsee jokaiselle alueelle pelimoodin; kaikki pelaavat aluetta samalla moodilla. */
export function PelimoodiAsetukset({ paikat, tunnus }: PelimoodiAsetuksetProps) {
  const [pelimoodit, setPelimoodit] = useState<AlueidenPelimoodit>(new Map());
  const [tallennetaan, setTallennetaan] = useState<string | null>(null);
  const [virhe, setVirhe] = useState<string | null>(null);

  useEffect(() => {
    haeAlueidenPelimoodit()
      .then(setPelimoodit)
      .catch(() => setVirhe("Pelimoodien lataus epäonnistui."));
  }, []);

  const alueet = useMemo(() => yhdistaKaikkiSamannimiset(ryhmitteleAlueiksi(paikat)), [paikat]);

  async function vaihdaMoodi(alueenNimi: string, moodi: string) {
    if (!onPelimoodi(moodi)) return;
    const avain = normalisoiAlueNimi(alueenNimi);

    setTallennetaan(avain);
    setVirhe(null);
    try {
      await asetaPelimoodi(avain, moodi, tunnus);
      setPelimoodit((edelliset) => new Map(edelliset).set(avain, moodi));
    } catch (e) {
      setVirhe(e instanceof Error ? e.message : "Pelimoodin tallennus epäonnistui");
    } finally {
      setTallennetaan(null);
    }
  }

  return (
    <>
      <h2>Alueiden pelimoodit</h2>

      <dl className="pelimoodi-selitteet">
        {PELIMOODIT.map((moodi) => (
          <div key={moodi}>
            <dt>{PELIMOODIN_NIMI[moodi]}</dt>
            <dd>{PELIMOODIN_KUVAUS[moodi]}</dd>
          </div>
        ))}
      </dl>

      {virhe && (
        <p className="lomake-virhe" role="alert">
          {virhe}
        </p>
      )}

      {alueet.length === 0 ? (
        <p className="tyhja-tila">Ei alueita.</p>
      ) : (
        <ul className="admin-katko-lista">
          {alueet.map((alue) => (
            <li key={alue.nimi} className="admin-katko-rivi">
              <span className="admin-katko-tiedot">
                {alue.nimi} ({alue.paikat.length} kätköä)
              </span>
              <select
                className="teksti-syote pelimoodi-valinta"
                value={alueenPelimoodi(pelimoodit, alue.nimi)}
                disabled={tallennetaan === normalisoiAlueNimi(alue.nimi)}
                onChange={(e) => vaihdaMoodi(alue.nimi, e.target.value)}
                aria-label={`${alue.nimi}: pelimoodi`}
              >
                {PELIMOODIT.map((moodi) => (
                  <option key={moodi} value={moodi}>
                    {PELIMOODIN_NIMI[moodi]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
