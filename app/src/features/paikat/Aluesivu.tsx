import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Alue } from "./alueet";
import type { Paikka, Loyto } from "./types";
import type { Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina } from "../etsi/distance";
import { KATKO_AVAUTUU_METREINA } from "../etsi/kynnykset";
import { KatkoPaneeli } from "./KatkoPaneeli";
import { omaSijaintiIkoni, loydettyIkoni, oletusIkoni } from "./leafletIkonit";
import loydotData from "../../data/loydot.json";

const loydot = loydotData as Loyto[];

interface AluesivuProps {
  alue: Alue;
  sijainti: Sijainti | null;
  onTakaisin: () => void;
}

function SovitaKarttaAlueeseen({ paikat }: { paikat: Paikka[] }) {
  const kartta = useMap();

  useEffect(() => {
    if (paikat.length === 0) return;
    const rajat = L.latLngBounds(paikat.map((paikka) => [paikka.lat, paikka.lng]));
    kartta.fitBounds(rajat, { padding: [40, 40] });
  }, [kartta, paikat]);

  return null;
}

export function Aluesivu({ alue, sijainti, onTakaisin }: AluesivuProps) {
  const [valittuPaikka, setValittuPaikka] = useState<Paikka | null>(null);
  const [vihjeViesti, setVihjeViesti] = useState<string | null>(null);
  const [omatLoydot, setOmatLoydot] = useState<Loyto[]>([]);

  const loydetytIdt = useMemo(
    () => new Set([...loydot, ...omatLoydot].map((loyto) => loyto.paikkaId)),
    [omatLoydot],
  );

  function lisaaLoyto(loyto: Loyto) {
    setOmatLoydot((edelliset) => [...edelliset, loyto]);
  }

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
      <button type="button" className="nappi nappi-toissijainen" onClick={onTakaisin}>
        ← Takaisin alueisiin
      </button>

      <h2>{alue.alue}</h2>
      <p className="alue-vihje-teksti">{alue.alueVihje}</p>

      {vihjeViesti && (
        <p className="vihje-tooltip" role="status">
          {vihjeViesti}
        </p>
      )}

      <div className="karttakontti">
        <MapContainer
          center={[alue.keskipiste.lat, alue.keskipiste.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <SovitaKarttaAlueeseen paikat={alue.paikat} />
          {alue.paikat.map((paikka) => (
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
        <KatkoPaneeli
          paikka={valittuPaikka}
          omatLoydot={omatLoydot}
          onLoyto={lisaaLoyto}
          onSulje={() => setValittuPaikka(null)}
        />
      )}
    </section>
  );
}
