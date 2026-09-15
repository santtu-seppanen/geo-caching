import { useCallback, useEffect, useMemo, useState } from "react";
import { useNearbyAlert, type LahellaOlevaPaikka } from "./features/etsi/useNearbyAlert";
import { etsiLaheisinAlue } from "./features/etsi/laheisinAlue";
import { ryhmitteleAlueiksi } from "./features/paikat/alueet";
import { Etusivu } from "./features/paikat/Etusivu";
import { Aluesivu } from "./features/paikat/Aluesivu";
import { Saannot } from "./features/saannot/Saannot";
import { AdminSivu } from "./features/admin/AdminSivu";
import type { Loyto, Paikka } from "./features/paikat/types";
import { haeLoydot, haePaikat } from "./features/paikat/paikatApi";
import { pyydaIlmoituslupa, nayttaIlmoitus } from "./lib/ilmoitukset";
import { virheTeksti } from "./lib/geolocation";
import heroKuva from "./assets/hero-illustration.svg";
import "./App.css";

type Lataustila = "lataa" | "valmis" | "virhe";

export function App() {
  const [valittuAlue, setValittuAlue] = useState<string | null>(null);
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);
  const [naytaSaannot, setNaytaSaannot] = useState(false);
  const [naytaAdmin, setNaytaAdmin] = useState(false);
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [loydot, setLoydot] = useState<Loyto[]>([]);
  const [omatLoydot, setOmatLoydot] = useState<Loyto[]>([]);
  const [lataustila, setLataustila] = useState<Lataustila>("lataa");

  useEffect(() => {
    pyydaIlmoituslupa();
  }, []);

  useEffect(() => {
    let peruttu = false;

    async function lataaData() {
      setLataustila("lataa");
      try {
        const [uudetPaikat, uudetLoydot] = await Promise.all([haePaikat(), haeLoydot()]);
        if (peruttu) return;
        setPaikat(uudetPaikat);
        setLoydot(uudetLoydot);
        setLataustila("valmis");
      } catch {
        if (peruttu) return;
        setLataustila("virhe");
      }
    }

    lataaData();

    return () => {
      peruttu = true;
    };
  }, []);

  const lisaaOmaLoyto = useCallback((loyto: Loyto) => {
    setOmatLoydot((edelliset) => [...edelliset, loyto]);
  }, []);

  const onHalytys = useCallback((lahella: LahellaOlevaPaikka) => {
    const viesti = `Olet ${Math.round(lahella.etaisyysMetreina)} m paikasta "${lahella.paikka.kuvaus}"`;
    setViimeisinHalytys(viesti);
    nayttaIlmoitus("Kätkö lähellä!", viesti);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const { sijainti, virhe } = useNearbyAlert(paikat, onHalytys);
  const alueet = useMemo(() => ryhmitteleAlueiksi(paikat), [paikat]);
  const aktiivinenAlue = alueet.find((alue) => alue.alue === valittuAlue) ?? null;

  const lahellaOlevaAlue = useMemo(
    () => etsiLaheisinAlue(paikat, sijainti),
    [sijainti, paikat],
  );

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
        {!naytaSaannot && !naytaAdmin && (
          <div className="otsikko-napit">
            <button
              type="button"
              className="saannot-linkki"
              onClick={() => setNaytaSaannot(true)}
            >
              Säännöt
            </button>
            <button
              type="button"
              className="saannot-linkki"
              onClick={() => setNaytaAdmin(true)}
            >
              Admin
            </button>
          </div>
        )}
      </header>

      {virhe && (
        <p className="halytysbanneri" role="alert">
          {virheTeksti(virhe)}
        </p>
      )}

      {viimeisinHalytys && (
        <p className="halytysbanneri" role="alert">
          {viimeisinHalytys}
        </p>
      )}

      {naytaAdmin ? (
        <AdminSivu onTakaisin={() => setNaytaAdmin(false)} />
      ) : naytaSaannot ? (
        <Saannot onTakaisin={() => setNaytaSaannot(false)} />
      ) : lataustila === "lataa" ? (
        <p className="tyhja-tila">Ladataan kätkötietoja…</p>
      ) : lataustila === "virhe" ? (
        <p className="halytysbanneri" role="alert">
          Kätkötietojen lataus epäonnistui. Tarkista verkkoyhteys.
        </p>
      ) : aktiivinenAlue ? (
        <Aluesivu
          alue={aktiivinenAlue}
          sijainti={sijainti}
          loydot={loydot}
          omatLoydot={omatLoydot}
          onLoyto={lisaaOmaLoyto}
          onTakaisin={() => setValittuAlue(null)}
        />
      ) : (
        <Etusivu
          alueet={alueet}
          lahellaOlevaAlue={lahellaOlevaAlue}
          onValitseAlue={setValittuAlue}
        />
      )}
    </main>
  );
}
