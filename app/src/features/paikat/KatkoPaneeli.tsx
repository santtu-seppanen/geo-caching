import { useState } from "react";
import type { FormEvent } from "react";
import type { Paikka, Loyto } from "./types";
import { ilmoitaLoyto } from "./loydotApi";
import { haePelaajanNimi, tallennaPelaajanNimi } from "../../lib/pelaajanNimi";
import { mitalitYhdelleKatkolle, MITALI_EMOJI } from "../tilastot/tilastoLaskenta";
import { pullonKokoNimi } from "./pullonKoko";
import { PullonKokoIkoni } from "./PullonKokoIkoni";
import { Modaali } from "../../lib/Modaali";
import { muotoileKesto } from "../../lib/kesto";
import { etsintaKaynnissa } from "../pelimoodit/etsinta";

interface KatkoPaneeliProps {
  paikka: Paikka;
  loydot: Loyto[];
  omatLoydot: Loyto[];
  /** Käynnissä olevan etsinnän aloitus, null jos ei käynnissä (ks. etsintaKaynnissa). */
  etsintaAlkoi: number | null;
  /** Edellinen oma löytö tai etsinnän aloitus — löydölle tallennetaan kesto tästä. null jos etsintää ei ole aloitettu. */
  loytoajastinAlkoi: number | null;
  /** Pelaajan nykyinen sijainti — worker vertaa sitä kätkön koordinaatteihin. */
  sijainti: { lat: number; lng: number } | null;
  onLoyto: (loyto: Loyto) => void;
  onSulje: () => void;
}

export function KatkoPaneeli({
  paikka,
  loydot,
  omatLoydot,
  etsintaAlkoi,
  loytoajastinAlkoi,
  sijainti,
  onLoyto,
  onSulje,
}: KatkoPaneeliProps) {
  const [nimi, setNimi] = useState(() => haePelaajanNimi());
  const [lahetetaan, setLahetetaan] = useState(false);
  const [virhe, setVirhe] = useState<string | null>(null);
  const [kuvaAuki, setKuvaAuki] = useState(false);
  const kuvaUrl = `${import.meta.env.VITE_LOYTO_API_URL}/kuvat/${paikka.kuva}`;

  const naytettavatLoydot = [
    ...loydot.filter((loyto) => loyto.paikkaId === paikka.id),
    ...omatLoydot.filter((loyto) => loyto.paikkaId === paikka.id),
  ];
  const mitalit = mitalitYhdelleKatkolle(naytettavatLoydot);

  const siistiNimi = nimi.trim();
  const joLoytanytTallaNimella = naytettavatLoydot.some(
    (loyto) => loyto.nimi.trim().toLowerCase() === siistiNimi.toLowerCase(),
  );

  async function lahetaLoyto(e: FormEvent) {
    e.preventDefault();
    const siistittyNimi = nimi.trim();
    if (!siistittyNimi || joLoytanytTallaNimella) return;

    setLahetetaan(true);
    setVirhe(null);
    // Tarkistetaan takaraja vasta lähetyshetkellä — paneeli on voinut olla
    // auki takarajan yli. Takarajan jälkeen löytö kirjataan ilman kestoa.
    const nyt = Date.now();
    const ajat =
      etsintaAlkoi !== null && loytoajastinAlkoi !== null && etsintaKaynnissa(etsintaAlkoi, nyt)
        ? { kestoMs: nyt - loytoajastinAlkoi, etsintaKestoMs: nyt - etsintaAlkoi }
        : null;
    const kestoMs = ajat?.kestoMs ?? null;
    try {
      await ilmoitaLoyto(paikka.id, siistittyNimi, ajat, sijainti);
      tallennaPelaajanNimi(siistittyNimi);
      onLoyto({ paikkaId: paikka.id, nimi: siistittyNimi, aika: new Date(nyt).toISOString(), kestoMs });
    } catch (virhe) {
      setVirhe(virhe instanceof Error ? virhe.message : "Löydön tallennus epäonnistui");
    } finally {
      setLahetetaan(false);
    }
  }

  return (
    <div className="katko-paneeli">
      <button type="button" className="nappi nappi-toissijainen sulje-nappi" onClick={onSulje}>
        Sulje
      </button>

      <button
        type="button"
        className="katko-kuva-nappi"
        onClick={() => setKuvaAuki(true)}
        aria-label="Avaa kuva isompana"
      >
        <img className="katko-kuva" src={kuvaUrl} alt={paikka.kuvaus} />
      </button>

      {kuvaAuki && (
        <Modaali onSulje={() => setKuvaAuki(false)} sisallonLuokka="modaali-sisalto-kuva">
          <button
            type="button"
            className="nappi nappi-toissijainen sulje-nappi"
            onClick={() => setKuvaAuki(false)}
          >
            Sulje
          </button>
          <img
            className="iso-kuva"
            src={kuvaUrl}
            alt={paikka.kuvaus}
            onClick={() => setKuvaAuki(false)}
          />
        </Modaali>
      )}
      <p className="katko-kuvaus">{paikka.kuvaus}</p>

      {paikka.pullonKokoMl != null && (
        <p className="katko-pullon-koko">
          <PullonKokoIkoni ml={paikka.pullonKokoMl} />
          {pullonKokoNimi(paikka.pullonKokoMl)} ({paikka.pullonKokoMl} ml)
        </p>
      )}

      <div className="loytajat">
        <h3>Löytäjät</h3>
        {naytettavatLoydot.length === 0 ? (
          <p className="tyhja-tila">Ei vielä löytäjiä — ole ensimmäinen!</p>
        ) : (
          <ul className="loytaja-lista">
            {naytettavatLoydot.map((loyto, indeksi) => {
              const mitali = mitalit.get(loyto.nimi);
              return (
                <li key={`${loyto.nimi}-${loyto.aika}-${indeksi}`}>
                  {mitali && <span aria-hidden="true">{MITALI_EMOJI[mitali]} </span>}
                  {loyto.nimi} — {new Date(loyto.aika).toLocaleDateString("fi-FI")}
                  {loyto.kestoMs != null && <> · ⏱ {muotoileKesto(loyto.kestoMs)}</>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form className="loyto-lomake" onSubmit={lahetaLoyto}>
        <label className="kentta">
          <span className="kentan-nimi">Nimesi</span>
          <input
            className="teksti-syote"
            value={nimi}
            onChange={(e) => setNimi(e.target.value)}
            placeholder="Esim. Matti M."
          />
        </label>
        {joLoytanytTallaNimella && (
          <p className="lomake-virhe" role="alert">
            Olet jo merkinnyt tämän kätkön löydetyksi nimellä “{siistiNimi}”.
          </p>
        )}
        {virhe && (
          <p className="lomake-virhe" role="alert">
            {virhe}
          </p>
        )}
        <button
          className="nappi nappi-ensisijainen"
          type="submit"
          disabled={!siistiNimi || lahetetaan || joLoytanytTallaNimella}
        >
          {lahetetaan ? "Lähetetään…" : "Merkitse löydetyksi"}
        </button>
      </form>
    </div>
  );
}
