import { useState } from "react";
import type { FormEvent } from "react";
import { muokkaaKatko } from "./adminApi";
import { paattelKuvaPaate, validoiMuokkausLomake, KUVA_MAX_TAVUA_PAKATTUNA } from "./validointi";
import type { MuokkausLomakeSyote } from "./validointi";
import { pakkaaKuva } from "./kuvaPakkaus";
import { lueTiedostoBase64na } from "./tiedosto";
import { KuvaKentta } from "./KuvaKentta";
import type { Paikka } from "../paikat/types";

interface MuokkaaKatkoLomakeProps {
  paikka: Paikka;
  adminSalasana: string;
  onTallennettu: (paikka: Paikka) => void;
  onSulje: () => void;
}

export function MuokkaaKatkoLomake({
  paikka,
  adminSalasana,
  onTallennettu,
  onSulje,
}: MuokkaaKatkoLomakeProps) {
  const [alue, setAlue] = useState(paikka.alue);
  const [kuvaus, setKuvaus] = useState(paikka.kuvaus);
  const [lat, setLat] = useState(String(paikka.lat));
  const [lng, setLng] = useState(String(paikka.lng));
  const [piilotaLahimmasta, setPiilotaLahimmasta] = useState(paikka.piilotaLahimmasta ?? false);
  const [kuvaTiedosto, setKuvaTiedosto] = useState<File | null>(null);
  const [lahetetaan, setLahetetaan] = useState(false);
  const [virhe, setVirhe] = useState<string | null>(null);

  const latNumero = lat.trim() === "" ? null : Number(lat);
  const lngNumero = lng.trim() === "" ? null : Number(lng);

  async function tallenna(e: FormEvent) {
    e.preventDefault();
    setVirhe(null);

    const syote: MuokkausLomakeSyote = { alue, kuvaus, lat: latNumero, lng: lngNumero, kuvaTiedosto };
    const virheet = validoiMuokkausLomake(syote);
    const ensimmainenVirhe = Object.values(virheet)[0];
    if (ensimmainenVirhe) {
      setVirhe(ensimmainenVirhe);
      return;
    }

    setLahetetaan(true);
    try {
      let kuva: { tiedostopaate: "jpg" | "svg"; data: string } | null = null;
      if (kuvaTiedosto) {
        const tiedostopaate = paattelKuvaPaate(kuvaTiedosto.name);
        if (!tiedostopaate) {
          setVirhe("Kuvan tiedostopäätettä ei tunnistettu");
          setLahetetaan(false);
          return;
        }
        kuva =
          tiedostopaate === "svg"
            ? { tiedostopaate, data: await lueTiedostoBase64na(kuvaTiedosto) }
            : await pakkaaKuva(kuvaTiedosto, KUVA_MAX_TAVUA_PAKATTUNA);
      }

      await muokkaaKatko(
        {
          id: paikka.id,
          alue: alue.trim(),
          kuvaus: kuvaus.trim(),
          lat: latNumero!,
          lng: lngNumero!,
          kuva,
          piilotaLahimmasta,
        },
        adminSalasana,
      );

      onTallennettu({
        ...paikka,
        alue: alue.trim(),
        kuvaus: kuvaus.trim(),
        lat: latNumero!,
        lng: lngNumero!,
        kuva: kuva ? `${paikka.id}.${kuva.tiedostopaate}` : paikka.kuva,
        piilotaLahimmasta,
      });
    } catch (e) {
      setVirhe(e instanceof Error ? e.message : "Kätkön päivitys epäonnistui");
    } finally {
      setLahetetaan(false);
    }
  }

  return (
    <section className="admin-lomake-kontti">
      <h2>Muokkaa kätköä</h2>

      <form className="admin-lomake" onSubmit={tallenna}>
        <label className="kentta">
          <span className="kentan-nimi">alue</span>
          <input className="teksti-syote" value={alue} onChange={(e) => setAlue(e.target.value)} />
        </label>

        <label className="kentta">
          <span className="kentan-nimi">kuvaus</span>
          <textarea
            className="teksti-syote"
            value={kuvaus}
            onChange={(e) => setKuvaus(e.target.value)}
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
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label className="kentta">
            <span className="kentan-nimi">lng</span>
            <input
              className="teksti-syote"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </label>
        </div>

        <KuvaKentta
          alkuperainenEsikatseluUrl={`${import.meta.env.VITE_LOYTO_API_URL}/kuvat/${paikka.kuva}`}
          onValitse={setKuvaTiedosto}
        />

        <label className="kentta kentta-valintaruutu">
          <input
            type="checkbox"
            checked={piilotaLahimmasta}
            onChange={(e) => setPiilotaLahimmasta(e.target.checked)}
          />
          <span className="kentan-nimi">Piilota "Lähin alue" -huomautuksesta etusivulla</span>
        </label>

        {virhe && (
          <p className="lomake-virhe" role="alert">
            {virhe}
          </p>
        )}

        <div className="lomake-ohjaimet">
          <button type="button" className="nappi nappi-toissijainen" onClick={onSulje}>
            Sulje
          </button>
          <button className="nappi nappi-ensisijainen" type="submit" disabled={lahetetaan}>
            {lahetetaan ? "Tallennetaan…" : "Tallenna"}
          </button>
        </div>
      </form>
    </section>
  );
}
