import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNearbyAlert, type LahellaOlevaPaikka } from "./features/etsi/useNearbyAlert";
import { etsiLahellaOlevatAlueet, etsiLaheisinAlue } from "./features/etsi/laheisinAlue";
import {
  ryhmitteleAlueiksi,
  yhdistaKaikkiSamannimiset,
  alueLoydettyKokonaan,
  yhdistaSamannimiset,
  normalisoiAlueNimi,
} from "./features/paikat/alueet";
import { uudetLoydot, muodostaLoytoIlmoitus } from "./features/paikat/loytoVertailu";
import { ansaitutMerkit } from "./features/tilastot/merkit";
import { haeJono } from "./lib/loytoJono";
import { lahetaJonotetutLoydot } from "./features/paikat/loydotApi";
import { LoytoAnimaatio } from "./features/paikat/LoytoAnimaatio";
import { yhdistaLoydot, mitalitYhdelleKatkolle } from "./features/tilastot/tilastoLaskenta";
import { Etusivu } from "./features/paikat/Etusivu";
import { Aluesivu } from "./features/paikat/Aluesivu";
import { Saannot } from "./features/saannot/Saannot";
import { Tilastot } from "./features/tilastot/Tilastot";
import { AdminSivu } from "./features/admin/AdminSivu";
import { Modaali } from "./lib/Modaali";
import type { Loyto, Paikka } from "./features/paikat/types";
import { haeLoydot, haePaikat } from "./features/paikat/paikatApi";
import {
  alueenPelimoodi,
  haeAlueidenPelimoodit,
  type AlueidenPelimoodit,
} from "./features/pelimoodit/pelimoodiApi";
import { tallennaEtsinnanAlku } from "./features/pelimoodit/pelitila";
import { pyydaIlmoituslupa, nayttaIlmoitus } from "./lib/ilmoitukset";
import { virheTeksti } from "./lib/geolocation";
import heroKuva from "./assets/hero-aarrearkku.jpg";
import "./App.css";

type Lataustila = "lataa" | "valmis" | "virhe";

/** Kuinka usein muiden pelaajien löytöjä tarkistetaan taustalla. */
const LOYTO_POLLAUS_MS = 20_000;
const JONON_LAHETYS_MS = 30_000;

export function App() {
  const [valittuAlue, setValittuAlue] = useState<string | null>(null);
  const [viimeisinHalytys, setViimeisinHalytys] = useState<string | null>(null);
  const [naytaSaannot, setNaytaSaannot] = useState(false);
  const [naytaTilastot, setNaytaTilastot] = useState(false);
  const [naytaAdmin, setNaytaAdmin] = useState(false);
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [loydot, setLoydot] = useState<Loyto[]>([]);
  // Jonotetut (vielä lähettämättä olevat) löydöt näkyvät omina löytöinä heti.
  const [omatLoydot, setOmatLoydot] = useState<Loyto[]>(() =>
    haeJono().map(({ paikkaId, nimi, aika, kestoMs, kommentti }) => ({ paikkaId, nimi, aika, kestoMs, kommentti })),
  );
  const [pelimoodit, setPelimoodit] = useState<AlueidenPelimoodit>(new Map());
  const [lataustila, setLataustila] = useState<Lataustila>("lataa");

  useEffect(() => {
    pyydaIlmoituslupa();
  }, []);

  useEffect(() => {
    let peruttu = false;

    async function lataaData() {
      setLataustila("lataa");
      try {
        const [uudetPaikat, uudetLoydot, uudetPelimoodit] = await Promise.all([
          haePaikat(),
          haeLoydot(),
          // Pelimoodien puuttuminen ei estä pelaamista — kaikki alueet
          // toimivat silloin oletusmoodissa.
          haeAlueidenPelimoodit().catch(() => new Map()),
        ]);
        if (peruttu) return;
        setPaikat(uudetPaikat);
        setLoydot(uudetLoydot);
        setPelimoodit(uudetPelimoodit);
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

  const [loytoAnimaatio, setLoytoAnimaatio] = useState<Loyto | null>(null);
  const suljeLoytoAnimaatio = useCallback(() => setLoytoAnimaatio(null), []);
  const animaationMitali = useMemo(() => {
    if (!loytoAnimaatio) return undefined;
    const katkonLoydot = yhdistaLoydot(loydot, omatLoydot).filter(
      (l) => l.paikkaId === loytoAnimaatio.paikkaId,
    );
    return mitalitYhdelleKatkolle(katkonLoydot).get(loytoAnimaatio.nimi);
  }, [loytoAnimaatio, loydot, omatLoydot]);

  const animaationMerkit = useMemo(
    () =>
      loytoAnimaatio
        ? ansaitutMerkit(loytoAnimaatio, paikat, yhdistaLoydot(loydot, omatLoydot))
        : [],
    [loytoAnimaatio, paikat, loydot, omatLoydot],
  );

  const lisaaOmaLoyto = useCallback((loyto: Loyto) => {
    setOmatLoydot((edelliset) => [...edelliset, loyto]);
    setLoytoAnimaatio(loyto);
  }, []);

  // Lähetetään offline-tilassa jonotetut löydöt heti kun yhteys palaa.
  useEffect(() => {
    const laheta = () => void lahetaJonotetutLoydot();
    laheta();
    window.addEventListener("online", laheta);
    const ajastin = setInterval(laheta, JONON_LAHETYS_MS);
    return () => {
      window.removeEventListener("online", laheta);
      clearInterval(ajastin);
    };
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
  // Näytettävän nimen mukaan yhdistetty lista — ks. yhdistaKaikkiSamannimiset
  // siitä miksi id-tunniste-pohjaista ryhmitteleAlueiksi-tulosta ei käytetä
  // suoraan täällä (etusivun laskuri, aluehaku, aktiivinen alue).
  const alueet = useMemo(
    () => yhdistaKaikkiSamannimiset(ryhmitteleAlueiksi(paikat)),
    [paikat],
  );
  const aktiivinenAlue = valittuAlue ? yhdistaSamannimiset(alueet, valittuAlue) : null;

  const lahellaOlevaAlue = useMemo(
    () => etsiLaheisinAlue(paikat, sijainti),
    [sijainti, paikat],
  );

  const lahellaOlevatAlueet = useMemo(
    () => etsiLahellaOlevatAlueet(paikat, sijainti),
    [sijainti, paikat],
  );

  const aloitaEtsinta = useCallback((nimi: string) => {
    tallennaEtsinnanAlku(normalisoiAlueNimi(nimi), Date.now());
    setValittuAlue(nimi);
  }, []);

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

      {loytoAnimaatio && (
        <LoytoAnimaatio
          nimi={loytoAnimaatio.nimi}
          mitali={animaationMitali}
          kestoMs={loytoAnimaatio.kestoMs ?? null}
          kommentti={loytoAnimaatio.kommentti}
          merkit={animaationMerkit}
          onSulje={suljeLoytoAnimaatio}
        />
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
          key={aktiivinenAlue.nimi}
          alue={aktiivinenAlue}
          pelimoodi={alueenPelimoodi(pelimoodit, aktiivinenAlue.nimi)}
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
          lahellaOlevatAlueet={lahellaOlevatAlueet}
          pelimoodit={pelimoodit}
          loydettyjaAlueitaKokonaan={loydettyjaAlueitaKokonaan}
          onValitseAlue={setValittuAlue}
          onAloitaEtsinta={aloitaEtsinta}
        />
      )}
    </main>
  );
}
