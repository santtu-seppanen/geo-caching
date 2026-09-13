import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { luoKatko, poistaKatko } from "./adminApi";
import { paattelKuvaPaate, validoiAdminLomake } from "./validointi";
import type { AdminLomakeSyote } from "./validointi";
import { haeNykyinenSijaintiKerran, virheTeksti } from "../../lib/geolocation";
import type { SijaintiVirhe } from "../../lib/geolocation";
import type { Paikka } from "../paikat/types";
import { haePaikat } from "../paikat/paikatApi";

const ADMIN_SALASANA_AVAIN = "viinakatkoily-admin-salasana";

interface AdminSivuProps {
  onTakaisin: () => void;
}

const TYHJA_LOMAKE = {
  id: "",
  alue: "",
  kuvaus: "",
  lat: "",
  lng: "",
};

/** Lukee tiedoston base64-merkkijonoksi ilman "data:...;base64,"-etuliitettä. */
function lueTiedostoBase64na(tiedosto: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tulos = reader.result;
      if (typeof tulos !== "string") {
        reject(new Error("Kuvan luku epäonnistui"));
        return;
      }
      const pilkku = tulos.indexOf(",");
      resolve(pilkku === -1 ? tulos : tulos.slice(pilkku + 1));
    };
    reader.onerror = () => reject(new Error("Kuvan luku epäonnistui"));
    reader.readAsDataURL(tiedosto);
  });
}

export function AdminSivu({ onTakaisin }: AdminSivuProps) {
  const [adminSalasana, setAdminSalasana] = useState(
    () => sessionStorage.getItem(ADMIN_SALASANA_AVAIN) ?? "",
  );
  const [lomake, setLomake] = useState(TYHJA_LOMAKE);
  const [kuvaTiedosto, setKuvaTiedosto] = useState<File | null>(null);
  const [kuvaEsikatselu, setKuvaEsikatselu] = useState<string | null>(null);
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

  useEffect(() => {
    lataaPaikat();
  }, []);

  async function lataaPaikat() {
    try {
      const uudetPaikat = await haePaikat();
      setPaikat(uudetPaikat);
      setPaikatVirhe(null);
    } catch {
      setPaikatVirhe("Kätkölistan lataus epäonnistui.");
    }
  }

  const alueEhdotukset = useMemo(
    () => [...new Set(paikat.map((paikka) => paikka.alue))],
    [paikat],
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
      await poistaKatko(id, adminSalasana);
      setPaikat((edelliset) => edelliset.filter((paikka) => paikka.id !== id));
      setPoistoOnnistui(`Kätkö "${id}" poistettu.`);
    } catch (e) {
      setPoistoVirhe(e instanceof Error ? e.message : "Kätkön poisto epäonnistui");
    } finally {
      setPoistetaan(null);
    }
  }

  function paivitaAdminSalasana(uusi: string) {
    setAdminSalasana(uusi);
    sessionStorage.setItem(ADMIN_SALASANA_AVAIN, uusi);
  }

  function paivitaKentta(kentta: keyof typeof TYHJA_LOMAKE, arvo: string) {
    setLomake((edellinen) => ({ ...edellinen, [kentta]: arvo }));
  }

  async function valitseKuva(e: ChangeEvent<HTMLInputElement>) {
    const tiedosto = e.target.files?.[0] ?? null;
    setKuvaTiedosto(tiedosto);
    if (!tiedosto) {
      setKuvaEsikatselu(null);
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Kuvan luku epäonnistui"));
        reader.readAsDataURL(tiedosto);
      });
      setKuvaEsikatselu(dataUrl);
    } catch {
      setKuvaEsikatselu(null);
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

  const syote: AdminLomakeSyote = {
    id: lomake.id,
    alue: lomake.alue,
    kuvaus: lomake.kuvaus,
    lat: latNumero,
    lng: lngNumero,
    kuvaTiedosto,
  };

  const pakollisetPuuttuvat =
    !lomake.id.trim() ||
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
      const kuvaData = await lueTiedostoBase64na(kuvaTiedosto!);
      const tulos = await luoKatko(
        {
          id: lomake.id.trim(),
          alue: lomake.alue.trim(),
          kuvaus: lomake.kuvaus.trim(),
          lat: latNumero!,
          lng: lngNumero!,
          kuva: { tiedostopaate, data: kuvaData },
        },
        adminSalasana,
      );
      setOnnistui(`Kätkö "${tulos.id}" luotu!`);
      setLomake(TYHJA_LOMAKE);
      setKuvaTiedosto(null);
      setKuvaEsikatselu(null);
      lataaPaikat();
    } catch (e) {
      setVirhe(e instanceof Error ? e.message : "Kätkön luonti epäonnistui");
    } finally {
      setLahetetaan(false);
    }
  }

  return (
    <section className="admin-lomake-kontti">
      <button type="button" className="nappi nappi-toissijainen" onClick={onTakaisin}>
        ← Takaisin
      </button>

      <h2>Luo uusi kätkö</h2>

      <form className="admin-lomake" onSubmit={lahetaLomake}>
        <label className="kentta">
          <span className="kentan-nimi">Admin-salasana</span>
          <input
            className="teksti-syote"
            type="password"
            value={adminSalasana}
            onChange={(e) => paivitaAdminSalasana(e.target.value)}
            autoComplete="off"
          />
        </label>

        <label className="kentta">
          <span className="kentan-nimi">id</span>
          <input
            className="teksti-syote"
            value={lomake.id}
            onChange={(e) => paivitaKentta("id", e.target.value)}
            placeholder="esim. lammin-honka"
          />
          <span className="kentan-vihje">Pieniä kirjaimia, numeroita ja väliviivoja.</span>
        </label>

        <label className="kentta">
          <span className="kentan-nimi">alue</span>
          <input
            className="teksti-syote"
            list="admin-alue-ehdotukset"
            value={lomake.alue}
            onChange={(e) => paivitaKentta("alue", e.target.value)}
            placeholder="esim. Lammin metsä"
          />
          <datalist id="admin-alue-ehdotukset">
            {alueEhdotukset.map((alue) => (
              <option key={alue} value={alue} />
            ))}
          </datalist>
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

        <label className="kentta">
          <span className="kentan-nimi">kuva</span>
          <input className="teksti-syote" type="file" accept="image/*" onChange={valitseKuva} />
        </label>

        {kuvaEsikatselu && (
          <img className="admin-kuva-esikatselu" src={kuvaEsikatselu} alt="Esikatselu kätkön kuvasta" />
        )}

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
              <span className="admin-katko-tiedot">
                {paikka.id} — {paikka.alue} — {paikka.kuvaus}
              </span>
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
    </section>
  );
}
