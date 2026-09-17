import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { kirjauduAdmin, luoKatko, poistaKatko } from "./adminApi";
import {
  paattelKuvaPaate,
  rakennaId,
  validoiAdminLomake,
  alueTunnisteeksi,
  KUVA_MAX_TAVUA_PAKATTUNA,
} from "./validointi";
import type { AdminLomakeSyote } from "./validointi";
import { pakkaaKuva } from "./kuvaPakkaus";
import { lueTiedostoBase64na } from "./tiedosto";
import { KuvaKentta } from "./KuvaKentta";
import { MuokkaaKatkoLomake } from "./MuokkaaKatkoLomake";
import { Modaali } from "../../lib/Modaali";
import { haeNykyinenSijaintiKerran, virheTeksti } from "../../lib/geolocation";
import type { SijaintiVirhe } from "../../lib/geolocation";
import type { Paikka } from "../paikat/types";
import { haePaikat } from "../paikat/paikatApi";
import { ryhmitteleAlueiksi, seuraavaVapaaNumero } from "../paikat/alueet";

interface AdminSivuProps {
  onTakaisin: () => void;
}

const TYHJA_LOMAKE = {
  alue: "",
  kuvaus: "",
  lat: "",
  lng: "",
};

export function AdminSivu({ onTakaisin }: AdminSivuProps) {
  const [adminSalasana, setAdminSalasana] = useState("");
  const [kirjauduttu, setKirjauduttu] = useState(false);
  const [salasanaSyote, setSalasanaSyote] = useState("");
  const [kirjaudutaan, setKirjaudutaan] = useState(false);
  const [kirjautumisVirhe, setKirjautumisVirhe] = useState<string | null>(null);
  const [lomake, setLomake] = useState(TYHJA_LOMAKE);
  const [kuvaTiedosto, setKuvaTiedosto] = useState<File | null>(null);
  const [lahetetaan, setLahetetaan] = useState(false);
  const [haetaanSijaintia, setHaetaanSijaintia] = useState(false);
  const [virhe, setVirhe] = useState<string | null>(null);
  const [onnistui, setOnnistui] = useState<string | null>(null);
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [paikatVirhe, setPaikatVirhe] = useState<string | null>(null);
  const [poistoVahvistus, setPoistoVahvistus] = useState<string | null>(null);
  const [poistetaan, setPoistetaan] = useState<string | null>(null);
  const [poistoVirhe, setPoistoVirhe] = useState<string | null>(null);
  const [poistoOnnistui, setPoistoOnnistui] = useState<string | null>(null);
  const [muokattavaPaikka, setMuokattavaPaikka] = useState<Paikka | null>(null);
  const [lomakeAvain, setLomakeAvain] = useState(0);

  useEffect(() => {
    if (kirjauduttu) lataaPaikat();
  }, [kirjauduttu]);

  async function lataaPaikat() {
    try {
      const uudetPaikat = await haePaikat();
      setPaikat(uudetPaikat);
      setPaikatVirhe(null);
    } catch {
      setPaikatVirhe("Kätkölistan lataus epäonnistui.");
    }
  }

  const olemassaOlevatAlueet = useMemo(() => ryhmitteleAlueiksi(paikat), [paikat]);

  async function kasittelePoisto(id: string) {
    if (poistoVahvistus !== id) {
      setPoistoVahvistus(id);
      return;
    }

    setPoistoVahvistus(null);
    setPoistetaan(id);
    setPoistoVirhe(null);
    setPoistoOnnistui(null);
    try {
      await poistaKatko(id, adminSalasana);
      setPaikat((edelliset) => edelliset.filter((paikka) => paikka.id !== id));
      setPoistoOnnistui(`Kätkö "${id}" poistettu.`);
    } catch (e) {
      setPoistoVirhe(e instanceof Error ? e.message : "Kätkön poisto epäonnistui");
    } finally {
      setPoistetaan(null);
    }
  }

  async function kirjaudu(e: FormEvent) {
    e.preventDefault();
    if (!salasanaSyote.trim()) return;

    setKirjaudutaan(true);
    setKirjautumisVirhe(null);
    try {
      await kirjauduAdmin(salasanaSyote);
      setAdminSalasana(salasanaSyote);
      setKirjauduttu(true);
    } catch {
      setKirjautumisVirhe("Väärä salasana");
    } finally {
      setKirjaudutaan(false);
    }
  }

  function kirjauduUlos() {
    setAdminSalasana("");
    setSalasanaSyote("");
    setKirjauduttu(false);
  }

  function paivitaKentta(kentta: keyof typeof TYHJA_LOMAKE, arvo: string) {
    setLomake((edellinen) => ({ ...edellinen, [kentta]: arvo }));
  }

  /**
   * Jos kirjoitettu alue-nimi johtaa tunnisteeseen, joka on jo käytössä
   * muilla kätköillä (esim. "apatti"), tasataan kenttä niiden käyttämään
   * kirjoitusasuun (esim. "Äpätti") heti kun kenttä menettää fokuksen —
   * ettei sama alue päädy näkymään kahdella eri nimellä.
   */
  function tasaaAlueOlemassaOlevaan() {
    const tunniste = alueTunnisteeksi(lomake.alue);
    if (!tunniste) return;
    const olemassaOleva = olemassaOlevatAlueet.find((alue) => alue.alue === tunniste);
    if (olemassaOleva && olemassaOleva.nimi !== lomake.alue) {
      setLomake((edellinen) => ({ ...edellinen, alue: olemassaOleva.nimi }));
    }
  }

  async function kaytaNykyistaSijaintia() {
    setHaetaanSijaintia(true);
    setVirhe(null);
    try {
      const sijainti = await haeNykyinenSijaintiKerran();
      setLomake((edellinen) => ({
        ...edellinen,
        lat: String(sijainti.lat),
        lng: String(sijainti.lng),
      }));
    } catch (e) {
      setVirhe(virheTeksti(e as SijaintiVirhe));
    } finally {
      setHaetaanSijaintia(false);
    }
  }

  const latNumero = lomake.lat.trim() === "" ? null : Number(lomake.lat);
  const lngNumero = lomake.lng.trim() === "" ? null : Number(lomake.lng);

  // Tunniste ja juokseva numero johdetaan alue-nimestä — admin ei kirjoita
  // niitä enää itse (ks. alueTunnisteeksi ja seuraavaVapaaNumero).
  const idNimi = alueTunnisteeksi(lomake.alue);
  const idNumero = idNimi ? String(seuraavaVapaaNumero(paikat, idNimi)) : "";

  const syote: AdminLomakeSyote = {
    idNimi,
    idNumero,
    alue: lomake.alue,
    kuvaus: lomake.kuvaus,
    lat: latNumero,
    lng: lngNumero,
    kuvaTiedosto,
  };

  const pakollisetPuuttuvat =
    !idNimi ||
    !idNumero ||
    !lomake.alue.trim() ||
    !lomake.kuvaus.trim() ||
    latNumero === null ||
    lngNumero === null ||
    !kuvaTiedosto ||
    !adminSalasana.trim();

  async function lahetaLomake(e: FormEvent) {
    e.preventDefault();
    setVirhe(null);
    setOnnistui(null);

    if (!adminSalasana.trim()) {
      setVirhe("Admin-salasana on pakollinen");
      return;
    }

    const virheet = validoiAdminLomake(syote);
    const ensimmainenVirhe = Object.values(virheet)[0];
    if (ensimmainenVirhe) {
      setVirhe(ensimmainenVirhe);
      return;
    }

    const tiedostopaate = paattelKuvaPaate(kuvaTiedosto!.name);
    if (!tiedostopaate) {
      setVirhe("Kuvan tiedostopäätettä ei tunnistettu");
      return;
    }

    setLahetetaan(true);
    try {
      // SVG on jo vektorimuotoinen eikä canvasilla pakkaaminen sovi siihen
      // (rasteroisi sen) — muut kuvatyypit pakataan aina pienemmäksi.
      const kuva =
        tiedostopaate === "svg"
          ? { tiedostopaate, data: await lueTiedostoBase64na(kuvaTiedosto!) }
          : await pakkaaKuva(kuvaTiedosto!, KUVA_MAX_TAVUA_PAKATTUNA);

      const tulos = await luoKatko(
        {
          id: rakennaId(idNimi, idNumero),
          alue: lomake.alue.trim(),
          kuvaus: lomake.kuvaus.trim(),
          lat: latNumero!,
          lng: lngNumero!,
          kuva,
        },
        adminSalasana,
      );
      setOnnistui(`Kätkö "${tulos.id}" luotu!`);
      setLomake(TYHJA_LOMAKE);
      setKuvaTiedosto(null);
      setLomakeAvain((edellinen) => edellinen + 1);
      lataaPaikat();
    } catch (e) {
      setVirhe(e instanceof Error ? e.message : "Kätkön luonti epäonnistui");
    } finally {
      setLahetetaan(false);
    }
  }

  if (!kirjauduttu) {
    return (
      <section className="admin-lomake-kontti">
        <button type="button" className="nappi nappi-toissijainen" onClick={onTakaisin}>
          ← Takaisin
        </button>

        <h2>Admin</h2>

        <form className="admin-lomake" onSubmit={kirjaudu}>
          <label className="kentta">
            <span className="kentan-nimi">Admin-salasana</span>
            <input
              className="teksti-syote"
              type="password"
              value={salasanaSyote}
              onChange={(e) => setSalasanaSyote(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>

          {kirjautumisVirhe && (
            <p className="lomake-virhe" role="alert">
              {kirjautumisVirhe}
            </p>
          )}

          <button
            className="nappi nappi-ensisijainen"
            type="submit"
            disabled={!salasanaSyote.trim() || kirjaudutaan}
          >
            {kirjaudutaan ? "Tarkistetaan…" : "Jatka"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-lomake-kontti">
      <button type="button" className="nappi nappi-toissijainen" onClick={onTakaisin}>
        ← Takaisin
      </button>
      <button type="button" className="nappi nappi-toissijainen" onClick={kirjauduUlos}>
        Vaihda salasana
      </button>

      <h2>Luo uusi kätkö</h2>

      <form className="admin-lomake" onSubmit={lahetaLomake}>
        <label className="kentta">
          <span className="kentan-nimi">alue</span>
          <input
            className="teksti-syote"
            value={lomake.alue}
            onChange={(e) => paivitaKentta("alue", e.target.value)}
            onBlur={tasaaAlueOlemassaOlevaan}
            placeholder="esim. Lammin metsä"
          />
        </label>

        <label className="kentta">
          <span className="kentan-nimi">kuvaus</span>
          <textarea
            className="teksti-syote"
            value={lomake.kuvaus}
            onChange={(e) => paivitaKentta("kuvaus", e.target.value)}
            rows={3}
          />
        </label>

        <div className="admin-sijainti-kentat">
          <label className="kentta">
            <span className="kentan-nimi">lat</span>
            <input
              className="teksti-syote"
              type="number"
              step="any"
              value={lomake.lat}
              onChange={(e) => paivitaKentta("lat", e.target.value)}
            />
          </label>
          <label className="kentta">
            <span className="kentan-nimi">lng</span>
            <input
              className="teksti-syote"
              type="number"
              step="any"
              value={lomake.lng}
              onChange={(e) => paivitaKentta("lng", e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="nappi nappi-toissijainen gps-nappi"
          onClick={kaytaNykyistaSijaintia}
          disabled={haetaanSijaintia}
        >
          {haetaanSijaintia ? "Haetaan sijaintia…" : "Käytä nykyistä sijaintia"}
        </button>

        <KuvaKentta
          key={lomakeAvain}
          onValitse={setKuvaTiedosto}
          vihjeTeksti="Ota kuva kameralla tai valitse tiedosto — kuva pakataan automaattisesti lähetettäessä."
        />

        {virhe && (
          <p className="lomake-virhe" role="alert">
            {virhe}
          </p>
        )}

        {onnistui && (
          <p className="halytysbanneri" role="status">
            {onnistui}
          </p>
        )}

        <button
          className="nappi nappi-ensisijainen"
          type="submit"
          disabled={pakollisetPuuttuvat || lahetetaan}
        >
          {lahetetaan ? "Lähetetään…" : "Luo kätkö"}
        </button>
      </form>

      <h2>Poista kätkö</h2>

      {paikatVirhe && (
        <p className="lomake-virhe" role="alert">
          {paikatVirhe}
        </p>
      )}

      {poistoVirhe && (
        <p className="lomake-virhe" role="alert">
          {poistoVirhe}
        </p>
      )}

      {poistoOnnistui && (
        <p className="halytysbanneri" role="status">
          {poistoOnnistui}
        </p>
      )}

      {paikat.length === 0 && !paikatVirhe ? (
        <p className="tyhja-tila">Ei kätköjä.</p>
      ) : (
        <ul className="admin-katko-lista">
          {paikat.map((paikka) => (
            <li key={paikka.id} className="admin-katko-rivi">
              <button
                type="button"
                className="admin-katko-tiedot admin-katko-avaa"
                onClick={() => setMuokattavaPaikka(paikka)}
              >
                {paikka.id} — {paikka.alue} — {paikka.kuvaus}
              </button>
              <button
                type="button"
                className={
                  poistoVahvistus === paikka.id
                    ? "nappi nappi-vaara"
                    : "nappi nappi-toissijainen"
                }
                disabled={!adminSalasana.trim() || poistetaan === paikka.id}
                onClick={() => kasittelePoisto(paikka.id)}
              >
                {poistetaan === paikka.id
                  ? "Poistetaan…"
                  : poistoVahvistus === paikka.id
                    ? "Vahvista poisto?"
                    : "Poista"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {muokattavaPaikka && (
        <Modaali onSulje={() => setMuokattavaPaikka(null)}>
          <MuokkaaKatkoLomake
            paikka={muokattavaPaikka}
            adminSalasana={adminSalasana}
            onTallennettu={(paivitetty) => {
              setPaikat((edelliset) =>
                edelliset.map((p) => (p.id === paivitetty.id ? paivitetty : p)),
              );
              setMuokattavaPaikka(null);
            }}
            onSulje={() => setMuokattavaPaikka(null)}
          />
        </Modaali>
      )}
    </section>
  );
}
