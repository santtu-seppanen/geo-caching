import { useCallback, useEffect, useState } from "react";
import { haePaikat, tallennaPaikka } from "./features/paikat/api";
import type { Paikka } from "./features/paikat/types";
import { useNearbyAlert } from "./features/etsi/useNearbyAlert";

export function App() {
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [kuvaus, setKuvaus] = useState("");
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);

  useEffect(() => {
    haePaikat().then(setPaikat).catch(console.error);
  }, []);

  const onHalytys = useCallback((lahella: { paikka: Paikka; etaisyysMetreina: number }) => {
    setViimeisinHalytys(
      `Olet ${Math.round(lahella.etaisyysMetreina)} m paikasta "${lahella.paikka.kuvaus}"`,
    );
  }, []);

  const { sijainti } = useNearbyAlert(paikat, onHalytys);

  async function tallenna() {
    if (!sijainti || !kuvaus.trim()) return;
    const uusi = await tallennaPaikka({ kuvaus, lat: sijainti.lat, lng: sijainti.lng });
    setPaikat((edelliset) => [uusi, ...edelliset]);
    setKuvaus("");
  }

  return (
    <main>
      <h1>Paikka-hälytin</h1>

      {viimeisinHalytys && <p role="alert">{viimeisinHalytys}</p>}

      <section>
        <input
          value={kuvaus}
          onChange={(e) => setKuvaus(e.target.value)}
          placeholder="Kuvaus paikasta"
        />
        <button onClick={tallenna} disabled={!sijainti}>
          Tallenna nykyinen sijainti
        </button>
      </section>

      <ul>
        {paikat.map((paikka) => (
          <li key={paikka.id}>{paikka.kuvaus}</li>
        ))}
      </ul>
    </main>
  );
}
