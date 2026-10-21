import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { kirjauduAdmin, luoAlue, luoKatko, poistaKatko, type AdminTunnus } from "./adminApi";
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
import { PullonKokoValitsin } from "./PullonKokoValitsin";
import { MuokkaaKatkoLomake } from "./MuokkaaKatkoLomake";
import { PelimoodiAsetukset } from "./PelimoodiAsetukset";
import { HaasteAsetukset } from "./HaasteAsetukset";
import { Modaali } from "../../lib/Modaali";
import { haeNykyinenSijaintiKerran, virheTeksti } from "../../lib/geolocation";
import type { SijaintiVirhe } from "../../lib/geolocation";
import type { Paikka } from "../paikat/types";
import { haePaikat } from "../paikat/paikatApi";
import { normalisoiAlueNimi, ryhmitteleAlueiksi, seuraavaVapaaNumero } from "../paikat/alueet";

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
  // null = ei kirjauduttu. Alueen salasanalla kirjautunut näkee ja muokkaa
  // vain oman alueensa kätköjä (worker tarkistaa saman).
  const [tunnus, setTunnus] = useState<AdminTunnus | null>(null);
  const kirjauduttu = tunnus !== null;
  const [alueSyote, setAlueSyote] = useState("");
  const [salasanaSyote, setSalasanaSyote] = useState("");
  const [kirjaudutaan, setKirjaudutaan] = useState(false);
  const [kirjautumisVirhe, setKirjautumisVirhe] = useState<string | null>(null);
  const [uusiAlue, setUusiAlue] = useState({ nimi: "", salasana: "", vahvistus: "" });
  const [luodaanAluetta, setLuodaanAluetta] = useState(false);
  const [alueenLuontiVirhe, setAlueenLuontiVirhe] = useState<string | null>(null);
  const [lomake, setLomake] = useState(TYHJA_LOMAKE);
  const [kuvaTiedosto, setKuvaTiedosto] = useState<File | null>(null);
  const [piilotaLahimmasta, setPiilotaLahimmasta] = useState(false);
  const [pullonKokoMl, setPullonKokoMl] = useState<number | null>(null);
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

  // Alueen adminin oma alue: kätköjen käyttämä kirjoitusasu jos alueella on
  // jo kätköjä, muuten kirjautumisessa annettu nimi.
  const omaAlue = tunnus?.alue
    ? (paikat.find((p) => normalisoiAlueNimi(p.alue) === normalisoiAlueNimi(tunnus.alue!))?.alue ?? tunnus.alue)
    : null;
  const naytettavatPaikat = useMemo(
    () => (omaAlue ? paikat.filter((p) => normalisoiAlueNimi(p.alue) === normalisoiAlueNimi(omaAlue)) : paikat),
    [paikat, omaAlue],
  );

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
      await poistaKatko(id, tunnus!);
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
      const yritys = { salasana: salasanaSyote, alue: alueSyote.trim() || null };
      const { kaikki } = await kirjauduAdmin(yritys);
      // Master-salasana oikeuttaa kaikkeen, vaikka alue olisi kirjoitettu.
      setTunnus(kaikki ? { ...yritys, alue: null } : yritys);
    } catch {
      setKirjautumisVirhe(alueSyote.trim() ? "Väärä alue tai salasana" : "Väärä salasana");
    } finally {
      setKirjaudutaan(false);
    }
  }

  async function luoUusiAlue(e: FormEvent) {
    e.preventDefault();
    setAlueenLuontiVirhe(null);
    if (uusiAlue.salasana !== uusiAlue.vahvistus) {
      setAlueenLuontiVirhe("Salasanat eivät täsmää");
      return;
    }

    setLuodaanAluetta(true);
    try {
      const nimi = uusiAlue.nimi.trim();
      await luoAlue(nimi, uusiAlue.salasana);
      setTunnus({ salasana: uusiAlue.salasana, alue: nimi });
      setUusiAlue({ nimi: "", salasana: "", vahvistus: "" });
    } catch (virhe) {
      setAlueenLuontiVirhe(virhe instanceof Error ? virhe.message : "Alueen luonti epäonnistui");
    } finally {
      setLuodaanAluetta(false);
    }
  }

  function kirjauduUlos() {
    setTunnus(null);
    setSalasanaSyote("");
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
    if (omaAlue) return;
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

  // Alueen adminilla alue on aina oma alue — kenttä on lukittu.
  const lomakkeenAlue = omaAlue ?? lomake.alue;

  // Tunniste ja juokseva numero johdetaan alue-nimestä — admin ei kirjoita
  // niitä enää itse (ks. alueTunnisteeksi ja seuraavaVapaaNumero).
  const idNimi = alueTunnisteeksi(lomakkeenAlue);
  const idNumero = idNimi ? String(seuraavaVapaaNumero(paikat, idNimi)) : "";

  const syote: AdminLomakeSyote = {
    idNimi,
    idNumero,
    alue: lomakkeenAlue,
    kuvaus: lomake.kuvaus,
    lat: latNumero,
    lng: lngNumero,
    kuvaTiedosto,
    pullonKokoMl,
  };

  const pakollisetPuuttuvat =
    !idNimi ||
    !idNumero ||
    !lomakkeenAlue.trim() ||
    !lomake.kuvaus.trim() ||
    latNumero === null ||
    lngNumero === null ||
    !kuvaTiedosto ||
    !tunnus;

  async function lahetaLomake(e: FormEvent) {
    e.preventDefault();
    setVirhe(null);
    setOnnistui(null);

    if (!tunnus) return;

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
          alue: lomakkeenAlue.trim(),
          kuvaus: lomake.kuvaus.trim(),
          lat: latNumero!,
          lng: lngNumero!,
          kuva,
          piilotaLahimmasta,
          pullonKokoMl,
        },
        tunnus,
      );
      setOnnistui(`Kätkö "${tulos.id}" luotu!`);
      setLomake(TYHJA_LOMAKE);
      setKuvaTiedosto(null);
      setPiilotaLahimmasta(false);
      setPullonKokoMl(null);
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
        <button
          type="button"
          className="nappi nappi-toissijainen nappi-takaisin"
          onClick={onTakaisin}
        >
          <span className="nappi-nuoli nappi-nuoli-vasen" aria-hidden="true" />
          Takaisin
        </button>

        <h2>Admin</h2>

        <form className="admin-lomake" onSubmit={kirjaudu}>
          <label className="kentta">
            <span className="kentan-nimi">Alue</span>
            <input
              className="teksti-syote"
              value={alueSyote}
              onChange={(e) => setAlueSyote(e.target.value)}
              placeholder="oman alueesi nimi (tyhjä = pääkäyttäjä)"
              autoComplete="off"
            />
          </label>

          <label className="kentta">
            <span className="kentan-nimi">Salasana</span>
            <input
              className="teksti-syote"
              type="password"
              value={salasanaSyote}
              onChange={(e) => setSalasanaSyote(e.target.value)}
              autoComplete="off"
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

        <h2>Luo uusi alue</h2>
        <p className="tyhja-tila">
          Kuka tahansa voi perustaa oman alueen. Salasanalla pääset myöhemmin lisäämään ja muokkaamaan
          vain tämän alueen kätköjä.
        </p>

        <form className="admin-lomake" onSubmit={luoUusiAlue}>
          <label className="kentta">
            <span className="kentan-nimi">Alueen nimi</span>
            <input
              className="teksti-syote"
              value={uusiAlue.nimi}
              onChange={(e) => setUusiAlue((a) => ({ ...a, nimi: e.target.value }))}
              placeholder="esim. Neittävä"
              autoComplete="off"
            />
          </label>
          <label className="kentta">
            <span className="kentan-nimi">Salasana (väh. 6 merkkiä)</span>
            <input
              className="teksti-syote"
              type="password"
              value={uusiAlue.salasana}
              onChange={(e) => setUusiAlue((a) => ({ ...a, salasana: e.target.value }))}
              autoComplete="new-password"
            />
          </label>
          <label className="kentta">
            <span className="kentan-nimi">Salasana uudelleen</span>
            <input
              className="teksti-syote"
              type="password"
              value={uusiAlue.vahvistus}
              onChange={(e) => setUusiAlue((a) => ({ ...a, vahvistus: e.target.value }))}
              autoComplete="new-password"
            />
          </label>

          {alueenLuontiVirhe && (
            <p className="lomake-virhe" role="alert">
              {alueenLuontiVirhe}
            </p>
          )}

          <button
            className="nappi nappi-ensisijainen"
            type="submit"
            disabled={!uusiAlue.nimi.trim() || uusiAlue.salasana.length < 6 || luodaanAluetta}
          >
            {luodaanAluetta ? "Luodaan…" : "Luo alue"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-lomake-kontti">
      <button
        type="button"
        className="nappi nappi-toissijainen nappi-takaisin"
        onClick={onTakaisin}
      >
        <span className="nappi-nuoli nappi-nuoli-vasen" aria-hidden="true" />
        Takaisin
      </button>
      <button type="button" className="nappi nappi-toissijainen" onClick={kirjauduUlos}>
        Kirjaudu ulos
      </button>

      <p className="tyhja-tila">{omaAlue ? `Hallitset aluetta ${omaAlue}.` : "Pääkäyttäjä — kaikki alueet."}</p>

      <h2>Luo uusi kätkö</h2>

      <form className="admin-lomake" onSubmit={lahetaLomake}>
        <label className="kentta">
          <span className="kentan-nimi">alue</span>
          <input
            className="teksti-syote"
            value={lomakkeenAlue}
            onChange={(e) => paivitaKentta("alue", e.target.value)}
            onBlur={tasaaAlueOlemassaOlevaan}
            readOnly={omaAlue !== null}
            placeholder="esim. Neittävä"
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

        <label className="kentta kentta-valintaruutu">
          <input
            type="checkbox"
            checked={piilotaLahimmasta}
            onChange={(e) => setPiilotaLahimmasta(e.target.checked)}
          />
          <span className="kentan-nimi">Piilota "Lähin alue" -huomautuksesta etusivulla</span>
        </label>

        <label className="kentta">
          <span className="kentan-nimi">Pullon koko (valinnainen)</span>
          <PullonKokoValitsin arvo={pullonKokoMl} onValitse={setPullonKokoMl} />
        </label>

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

      <PelimoodiAsetukset paikat={naytettavatPaikat} tunnus={tunnus} />

      {!omaAlue && <HaasteAsetukset adminSalasana={tunnus.salasana} />}

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

      {naytettavatPaikat.length === 0 && !paikatVirhe ? (
        <p className="tyhja-tila">Ei kätköjä.</p>
      ) : (
        <ul className="admin-katko-lista">
          {naytettavatPaikat.map((paikka) => (
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
                disabled={poistetaan === paikka.id}
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
            tunnus={tunnus}
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
