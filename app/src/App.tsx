import { useCallback, useEffect, useRef, useState } from "react";
import { haePaikat, tallennaPaikka } from "./features/paikat/api";
import type { Paikka } from "./features/paikat/types";
import { useNearbyAlert } from "./features/etsi/useNearbyAlert";
import heroKuva from "./assets/hero-illustration.svg";
import "./App.css";

export function App() {
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [kuvaus, setKuvaus] = useState("");
  const [kuva, setKuva] = useState<File | null>(null);
  const [kuvaEsikatselu, setKuvaEsikatselu] = useState<string | null>(null);
  const [tallennetaan, setTallennetaan] = useState(false);
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);
  const tiedostoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    haePaikat().then(setPaikat).catch(console.error);
  }, []);

  useEffect(() => {
    if (!kuva) {
      setKuvaEsikatselu(null);
      return;
    }
    const url = URL.createObjectURL(kuva);
    setKuvaEsikatselu(url);
    return () => URL.revokeObjectURL(url);
  }, [kuva]);

  const onHalytys = useCallback((lahella: { paikka: Paikka; etaisyysMetreina: number }) => {
    setViimeisinHalytys(
      `Olet ${Math.round(lahella.etaisyysMetreina)} m paikasta "${lahella.paikka.kuvaus}"`,
    );
  }, []);

  const { sijainti } = useNearbyAlert(paikat, onHalytys);

  function valitseKuva(e: React.ChangeEvent<HTMLInputElement>) {
    const tiedosto = e.target.files?.[0] ?? null;
    setKuva(tiedosto);
  }

  function poistaValittuKuva() {
    setKuva(null);
    if (tiedostoInputRef.current) tiedostoInputRef.current.value = "";
  }

  async function tallenna() {
    if (!sijainti || !kuvaus.trim()) return;
    setTallennetaan(true);
    try {
      const uusi = await tallennaPaikka({
        kuvaus,
        lat: sijainti.lat,
        lng: sijainti.lng,
        kuva: kuva ?? undefined,
      });
      setPaikat((edelliset) => [uusi, ...edelliset]);
      setKuvaus("");
      poistaValittuKuva();
    } finally {
      setTallennetaan(false);
    }
  }

  return (
    <main className="sovellus">
      <header className="otsikko">
        <img
          className="hero-kuva"
          src={heroKuva}
          alt="Piirroshahmo seikkailemassa mäen pihalla ja mäntymetsässä, etsimässä kätköä"
        />
        <h1>Viinakätköily</h1>
        <p className="alaotsikko">Tallenna paikkoja ja saa hälytys, kun olet lähellä.</p>
      </header>

      {viimeisinHalytys && (
        <p className="halytysbanneri" role="alert">
          {viimeisinHalytys}
        </p>
      )}

      <section className="lomakekortti">
        <label className="kentta">
          <span className="kentan-nimi">Kuvaus</span>
          <input
            className="teksti-syote"
            value={kuvaus}
            onChange={(e) => setKuvaus(e.target.value)}
            placeholder="Esim. Kiva näköalapaikka"
          />
        </label>

        <label className="kentta">
          <span className="kentan-nimi">Kuva (valinnainen)</span>
          <input
            ref={tiedostoInputRef}
            className="tiedosto-syote"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={valitseKuva}
          />
        </label>

        {kuvaEsikatselu && (
          <div className="esikatselu">
            <img src={kuvaEsikatselu} alt="Esikatselu valitusta kuvasta" />
            <button
              type="button"
              className="nappi nappi-toissijainen"
              onClick={poistaValittuKuva}
            >
              Poista kuva
            </button>
          </div>
        )}

        <button
          className="nappi nappi-ensisijainen"
          onClick={tallenna}
          disabled={!sijainti || !kuvaus.trim() || tallennetaan}
        >
          {tallennetaan
            ? "Tallennetaan…"
            : sijainti
              ? "Tallenna nykyinen sijainti"
              : "Haetaan sijaintia…"}
        </button>
      </section>

      <section className="paikkalista">
        <h2>Tallennetut paikat</h2>
        {paikat.length === 0 ? (
          <p className="tyhja-tila">Ei vielä tallennettuja paikkoja.</p>
        ) : (
          <ul className="paikat">
            {paikat.map((paikka) => (
              <li key={paikka.id} className="paikka-kortti">
                {paikka.kuva_tiedosto && (
                  <img
                    className="paikka-kuva"
                    src={paikka.kuva_tiedosto}
                    alt={paikka.kuvaus}
                  />
                )}
                <div className="paikka-tiedot">
                  <p className="paikka-kuvaus">{paikka.kuvaus}</p>
                  <p className="paikka-aika">
                    {new Date(paikka.luotu).toLocaleString("fi-FI")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
