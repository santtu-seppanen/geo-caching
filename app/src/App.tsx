import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNearbyAlert, type LahellaOlevaPaikka } from "./features/etsi/useNearbyAlert";
import { etsiLaheisinAlue } from "./features/etsi/laheisinAlue";
import { ryhmitteleAlueiksi, alueLoydettyKokonaan } from "./features/paikat/alueet";
import { uudetLoydot, muodostaLoytoIlmoitus } from "./features/paikat/loytoVertailu";
import { Etusivu } from "./features/paikat/Etusivu";
import { Aluesivu } from "./features/paikat/Aluesivu";
import { Saannot } from "./features/saannot/Saannot";
import { Tilastot } from "./features/tilastot/Tilastot";
import { AdminSivu } from "./features/admin/AdminSivu";
import { Modaali } from "./lib/Modaali";
import type { Loyto, Paikka } from "./features/paikat/types";
import { haeLoydot, haePaikat } from "./features/paikat/paikatApi";
import { pyydaIlmoituslupa, nayttaIlmoitus } from "./lib/ilmoitukset";
import { virheTeksti } from "./lib/geolocation";
import heroKuva from "./assets/hero-aarrearkku.jpg";
import "./App.css";

type Lataustila = "lataa" | "valmis" | "virhe";

/** Kuinka usein muiden pelaajien löytöjä tarkistetaan taustalla. */
const LOYTO_POLLAUS_MS = 20_000;

export function App() {
  const [valittuAlue, setValittuAlue] = useState<string | null>(null);
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);
  const [naytaSaannot, setNaytaSaannot] = useState(false);
  const [naytaTilastot, setNaytaTilastot] = useState(false);
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

  const paikatRef = useRef<Paikka[]>([]);
  const omatLoydotRef = useRef<Loyto[]>([]);
  useEffect(() => {
    paikatRef.current = paikat;
  }, [paikat]);
  useEffect(() => {
    omatLoydotRef.current = omatLoydot;
  }, [omatLoydot]);

  useEffect(() => {
    const ajastin = setInterval(async () => {
      try {
        const tuoreetLoydot = await haeLoydot();
        setLoydot((edelliset) => {
          const muidenLoydot = uudetLoydot(edelliset, tuoreetLoydot).filter(
            (loyto) =>
              !omatLoydotRef.current.some(
                (oma) => oma.paikkaId === loyto.paikkaId && oma.nimi === loyto.nimi,
              ),
          );
          for (const loyto of muidenLoydot) {
            const paikka = paikatRef.current.find((p) => p.id === loyto.paikkaId);
            const { otsikko, viesti } = muodostaLoytoIlmoitus(loyto, paikka);
            nayttaIlmoitus(otsikko, viesti);
          }
          return tuoreetLoydot;
        });
      } catch {
        // Hiljainen epäonnistuminen — yritetään uudelleen seuraavalla pollauksella.
      }
    }, LOYTO_POLLAUS_MS);

    return () => clearInterval(ajastin);
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

  const loydetytIdt = useMemo(
    () => new Set([...loydot, ...omatLoydot].map((loyto) => loyto.paikkaId)),
    [loydot, omatLoydot],
  );

  const loydettyjaAlueitaKokonaan = useMemo(
    () => alueet.filter((alue) => alueLoydettyKokonaan(alue, loydetytIdt)).length,
    [alueet, loydetytIdt],
  );

  return (
    <main className="sovellus">
      <header className="otsikko">
        <img
          className="hero-kuva"
          src={heroKuva}
          alt="Puinen aarrearkku puun juurella metsässä auringonlaskussa, sisällä viinapullo, käsissä muistikirja ja kartalla varustettu puhelin"
        />
        <h1>Viinakätköily</h1>
        <p className="alaotsikko">Etsi kätköjä lähelläsi ja merkitse löydöt.</p>
        {!naytaAdmin && (
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
              onClick={() => setNaytaTilastot(true)}
            >
              Tilastot
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

      {naytaSaannot && (
        <Modaali onSulje={() => setNaytaSaannot(false)}>
          <Saannot onSulje={() => setNaytaSaannot(false)} />
        </Modaali>
      )}

      {naytaTilastot && (
        <Modaali onSulje={() => setNaytaTilastot(false)}>
          <Tilastot
            paikat={paikat}
            loydot={loydot}
            omatLoydot={omatLoydot}
            onSulje={() => setNaytaTilastot(false)}
          />
        </Modaali>
      )}

      {naytaAdmin ? (
        <AdminSivu onTakaisin={() => setNaytaAdmin(false)} />
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
          loydettyjaAlueitaKokonaan={loydettyjaAlueitaKokonaan}
          onValitseAlue={setValittuAlue}
        />
      )}
    </main>
  );
}
