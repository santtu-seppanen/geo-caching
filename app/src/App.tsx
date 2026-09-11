import { useCallback, useEffect, useMemo, useState } from "react";
import { useNearbyAlert, type LahellaOlevaPaikka } from "./features/etsi/useNearbyAlert";
import { ryhmitteleAlueiksi } from "./features/paikat/alueet";
import { Etusivu } from "./features/paikat/Etusivu";
import { Aluesivu } from "./features/paikat/Aluesivu";
import type { Paikka } from "./features/paikat/types";
import { pyydaIlmoituslupa, nayttaIlmoitus } from "./lib/ilmoitukset";
import paikatData from "./data/paikat.json";
import heroKuva from "./assets/hero-illustration.svg";
import "./App.css";

const paikat = paikatData as Paikka[];

export function App() {
  const [valittuAlue, setValittuAlue] = useState<string | null>(null);
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);

  useEffect(() => {
    pyydaIlmoituslupa();
  }, []);

  const onHalytys = useCallback((lahella: LahellaOlevaPaikka) => {
    const viesti = `Olet ${Math.round(lahella.etaisyysMetreina)} m paikasta "${lahella.paikka.kuvaus}"`;
    setViimeisinHalytys(viesti);
    nayttaIlmoitus("Kätkö lähellä!", viesti);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const { sijainti } = useNearbyAlert(paikat, onHalytys);
  const alueet = useMemo(() => ryhmitteleAlueiksi(paikat), []);
  const aktiivinenAlue = alueet.find((alue) => alue.alue === valittuAlue) ?? null;

  return (
    <main className="sovellus">
      <header className="otsikko">
        <img
          className="hero-kuva"
          src={heroKuva}
          alt="Piirroshahmo seikkailemassa mäen pihalla ja mäntymetsässä, etsimässä kätköä"
        />
        <h1>Viinakätköily</h1>
        <p className="alaotsikko">Etsi kätköjä lähelläsi ja merkitse löydöt.</p>
      </header>

      {viimeisinHalytys && (
        <p className="halytysbanneri" role="alert">
          {viimeisinHalytys}
        </p>
      )}

      {aktiivinenAlue ? (
        <Aluesivu
          alue={aktiivinenAlue}
          sijainti={sijainti}
          onTakaisin={() => setValittuAlue(null)}
        />
      ) : (
        <Etusivu alueet={alueet} sijainti={sijainti} onValitseAlue={setValittuAlue} />
      )}
    </main>
  );
}
