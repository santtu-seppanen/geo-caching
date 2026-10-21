import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Alue } from "./alueet";
import { alueenLoydettyjenMaara, normalisoiAlueNimi } from "./alueet";
import type { Paikka, Loyto } from "./types";
import type { Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina } from "../etsi/distance";
import { KATKO_AVAUTUU_METREINA } from "../etsi/kynnykset";
import { KatkoPaneeli } from "./KatkoPaneeli";
import { alueenMestarit, yhdistaLoydot } from "../tilastot/tilastoLaskenta";
import { Edistymispalkki } from "./Edistymispalkki";
import { omaSijaintiIkoni, loydettyIkoni, oletusIkoni } from "./leafletIkonit";
import { Modaali } from "../../lib/Modaali";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";
import { kohdePiilossa, nakyvatPaikat, type Pelimoodi } from "../pelimoodit/pelimoodit";
import { etsinnanEteneminen, etsintaKaynnissa, loytoajastimenAlku } from "../pelimoodit/etsinta";
import {
  avautuneitaVihjeita,
  mitattuEtaisyys,
  vihjeYmpyranKeskipiste,
  VIHJE_TASOT,
} from "../pelimoodit/vihjeet";
import { useNyt, usePelitila } from "../pelimoodit/usePelitila";
import { lataaEtsinnanAlku, tallennaEtsinnanAlku } from "../pelimoodit/pelitila";
import { PelimoodiPaneeli } from "../pelimoodit/PelimoodiPaneeli";
import { ilmoitaEtsinnanAloitus } from "../pelimoodit/etsinnatApi";

interface AluesivuProps {
  alue: Alue;
  pelimoodi: Pelimoodi;
  sijainti: Sijainti | null;
  loydot: Loyto[];
  omatLoydot: Loyto[];
  onLoyto: (loyto: Loyto) => void;
  onTakaisin: () => void;
}

interface Ympyra {
  keskipiste: { lat: number; lng: number };
  sadeMetreina: number;
}

/**
 * Sovittaa kartan annettuihin pisteisiin ja ympyröihin. Sovitetaan vain kun
 * niiden joukko oikeasti muuttuu (avain), ettei kartta hyppää takaisin
 * jokaisella sijaintipäivityksellä käyttäjän panoroidessa.
 */
function SovitaKartta({ pisteet, ympyrat }: { pisteet: { lat: number; lng: number }[]; ympyrat: Ympyra[] }) {
  const kartta = useMap();
  const avain = JSON.stringify([pisteet, ympyrat]);

  useEffect(() => {
    const rajat = L.latLngBounds([]);
    for (const piste of pisteet) rajat.extend([piste.lat, piste.lng]);
    for (const ympyra of ympyrat) {
      rajat.extend(L.latLng(ympyra.keskipiste.lat, ympyra.keskipiste.lng).toBounds(ympyra.sadeMetreina * 2));
    }
    if (rajat.isValid()) kartta.fitBounds(rajat, { padding: [40, 40], maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avain kattaa pisteet ja ympyrat
  }, [kartta, avain]);

  return null;
}

export function Aluesivu({
  alue,
  pelimoodi,
  sijainti,
  loydot,
  omatLoydot,
  onLoyto,
  onTakaisin,
}: AluesivuProps) {
  const [valittuPaikka, setValittuPaikka] = useState<Paikka | null>(null);
  const [vihjeViesti, setVihjeViesti] = useState<string | null>(null);

  const loydetytIdt = useMemo(
    () => new Set([...loydot, ...omatLoydot].map((loyto) => loyto.paikkaId)),
    [loydot, omatLoydot],
  );

  const mestarit = useMemo(
    () =>
      alueenMestarit(new Set(alue.paikat.map((p) => p.id)), yhdistaLoydot(loydot, omatLoydot)),
    [alue, loydot, omatLoydot],
  );

  // Pelimoodeissa edetään pelaajan omien löytöjen mukaan, ei kenen tahansa.
  // Aikaisin löytöhetki per kätkö — etsinnän eteneminen ja löytöajastin
  // johdetaan näistä (ks. etsinta.ts).
  const pelaajanNimi = haePelaajanNimi().trim().toLowerCase();
  const omatLoytoajat = useMemo(() => {
    const ajat = new Map<string, number>();
    for (const loyto of [
      ...omatLoydot,
      ...loydot.filter((loyto) => pelaajanNimi && loyto.nimi.trim().toLowerCase() === pelaajanNimi),
    ]) {
      const aika = Date.parse(loyto.aika);
      const aiempi = ajat.get(loyto.paikkaId);
      if (aiempi === undefined || aika < aiempi) ajat.set(loyto.paikkaId, aika);
    }
    return ajat;
  }, [loydot, omatLoydot, pelaajanNimi]);
  const omatLoydetytIdt = useMemo(() => new Set(omatLoytoajat.keys()), [omatLoytoajat]);

  const alueAvain = normalisoiAlueNimi(alue.nimi);
  const [etsintaAlkoi, setEtsintaAlkoi] = useState(() => lataaEtsinnanAlku(alueAvain));
  function aloitaEtsinta() {
    const alkoi = Date.now();
    tallennaEtsinnanAlku(alueAvain, alkoi);
    ilmoitaEtsinnanAloitus(alueAvain);
    setEtsintaAlkoi(alkoi);
  }

  const nyt = useNyt(1000, etsintaAlkoi !== null || pelimoodi === "kolmiomittaus");
  // Takarajan jälkeen etsintä on kuin aloittamaton: ajastettu haku ja
  // vihjeet pysähtyvät eikä löydöille tallenneta kestoa.
  const kaynnissa = etsintaKaynnissa(etsintaAlkoi, nyt);
  const aktiivinenAlku = kaynnissa ? etsintaAlkoi : null;
  const eteneminen = etsinnanEteneminen(pelimoodi, alue.paikat, omatLoytoajat, aktiivinenAlku, nyt);
  const { kohde, vuoroAlkoi } = eteneminen;
  const loytoajastinAlkoi = loytoajastimenAlku(omatLoytoajat, aktiivinenAlku);

  const piilossa = kohdePiilossa(pelimoodi) && kohde !== null;
  const { tila, lisaaMittaus } = usePelitila(piilossa ? kohde.id : null);

  function mittaa() {
    if (!sijainti || !kohde) return;
    lisaaMittaus({
      lat: sijainti.lat,
      lng: sijainti.lng,
      etaisyysMetreina: mitattuEtaisyys(sijainti, kohde),
      aika: Date.now(),
    });
  }

  const naytettavatPaikat = nakyvatPaikat(pelimoodi, alue.paikat, omatLoydetytIdt, kohde, sijainti);

  const mittausYmpyrat: Ympyra[] =
    pelimoodi === "kolmiomittaus" && piilossa
      ? tila.mittaukset.map((mittaus) => ({ keskipiste: mittaus, sadeMetreina: mittaus.etaisyysMetreina }))
      : [];

  const vihjeYmpyrat: Ympyra[] =
    pelimoodi === "vihjeet" && piilossa && vuoroAlkoi !== null
      ? VIHJE_TASOT.slice(0, avautuneitaVihjeita(vuoroAlkoi, nyt)).map((taso, indeksi) => ({
          keskipiste: vihjeYmpyranKeskipiste(kohde, indeksi),
          sadeMetreina: taso.sadeMetreina,
        }))
      : [];

  // Piilomoodissa kartta ei saa keskittyä alueen kätköihin (yhden kätkön
  // alueella keskipiste olisi itse kätkö) — sovitetaan näkyviin asioihin.
  const sovitusPisteet = piilossa
    ? [...naytettavatPaikat, ...tila.mittaukset]
    : pelimoodi === "vapaa"
      ? alue.paikat
      : naytettavatPaikat;
  const sovitusYmpyrat = vihjeYmpyrat.slice(-1);
  const alkuKeskipiste = piilossa && sijainti ? sijainti : alue.keskipiste;

  function valitsePaikka(paikka: Paikka) {
    if (!sijainti) {
      setValittuPaikka(null);
      setVihjeViesti("Odotetaan sijaintia…");
      return;
    }

    const etaisyys = etaisyysMetreina(sijainti, paikka);
    if (etaisyys <= KATKO_AVAUTUU_METREINA) {
      setValittuPaikka(paikka);
      setVihjeViesti(null);
    } else {
      setValittuPaikka(null);
      setVihjeViesti("Tule lähemmäs löytääksesi kätkön");
    }
  }

  return (
    <section className="aluesivu">
      <button
        type="button"
        className="nappi nappi-toissijainen nappi-takaisin"
        onClick={onTakaisin}
      >
        <span className="nappi-nuoli nappi-nuoli-vasen" aria-hidden="true" />
        Takaisin hakuun
      </button>

      <h2>{alue.nimi}</h2>

      <Edistymispalkki
        loydetty={alueenLoydettyjenMaara(alue, loydetytIdt)}
        yhteensa={alue.paikat.length}
        teksti="kätköä löydetty tällä alueella"
      />

      {mestarit.maara > 0 && (
        <p className="alueen-mestari">
          👑 Alueen mestari: {mestarit.nimet.join(", ")} ({mestarit.maara} kätköä)
        </p>
      )}

      <PelimoodiPaneeli
        moodi={pelimoodi}
        paikat={alue.paikat}
        eteneminen={eteneminen}
        etsintaAlkoi={etsintaAlkoi}
        kaynnissa={kaynnissa}
        loytoajastinAlkoi={loytoajastinAlkoi}
        kaikkiLoydetty={alue.paikat.every((paikka) => omatLoydetytIdt.has(paikka.id))}
        tila={tila}
        nyt={nyt}
        sijaintiTiedossa={sijainti !== null}
        onMittaa={mittaa}
        onAloita={aloitaEtsinta}
      />

      {vihjeViesti && (
        <p className="vihje-tooltip" role="status">
          {vihjeViesti}
        </p>
      )}

      <div className="karttakontti">
        <MapContainer
          center={[alkuKeskipiste.lat, alkuKeskipiste.lng]}
          zoom={piilossa ? 13 : 14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <SovitaKartta pisteet={sovitusPisteet} ympyrat={sovitusYmpyrat} />
          {vihjeYmpyrat.map((ympyra, indeksi) => (
            <Circle
              key={`vihje-${indeksi}`}
              center={[ympyra.keskipiste.lat, ympyra.keskipiste.lng]}
              radius={ympyra.sadeMetreina}
              pathOptions={{
                className: "vihje-ympyra",
                weight: 2,
                fillOpacity: indeksi === vihjeYmpyrat.length - 1 ? 0.2 : 0.05,
                opacity: indeksi === vihjeYmpyrat.length - 1 ? 1 : 0.4,
              }}
            />
          ))}
          {mittausYmpyrat.map((ympyra, indeksi) => (
            <Circle
              key={`mittaus-${indeksi}`}
              center={[ympyra.keskipiste.lat, ympyra.keskipiste.lng]}
              radius={ympyra.sadeMetreina}
              pathOptions={{ className: "mittaus-ympyra", weight: 2, dashArray: "6 6", fill: false }}
            />
          ))}
          {mittausYmpyrat.map((ympyra, indeksi) => (
            <CircleMarker
              key={`mittauspiste-${indeksi}`}
              center={[ympyra.keskipiste.lat, ympyra.keskipiste.lng]}
              radius={4}
              pathOptions={{ className: "mittaus-ympyra", weight: 2, fillOpacity: 1 }}
            />
          ))}
          {naytettavatPaikat.map((paikka) => (
            <Marker
              key={paikka.id}
              position={[paikka.lat, paikka.lng]}
              icon={loydetytIdt.has(paikka.id) ? loydettyIkoni : oletusIkoni}
              eventHandlers={{ click: () => valitsePaikka(paikka) }}
            />
          ))}
          {sijainti && (
            <Marker position={[sijainti.lat, sijainti.lng]} icon={omaSijaintiIkoni} />
          )}
        </MapContainer>
      </div>

      {valittuPaikka && (
        <Modaali onSulje={() => setValittuPaikka(null)}>
          <KatkoPaneeli
            paikka={valittuPaikka}
            loydot={loydot}
            omatLoydot={omatLoydot}
            etsintaAlkoi={aktiivinenAlku}
            loytoajastinAlkoi={loytoajastinAlkoi}
            sijainti={sijainti}
            onLoyto={onLoyto}
            onSulje={() => setValittuPaikka(null)}
          />
        </Modaali>
      )}
    </section>
  );
}
