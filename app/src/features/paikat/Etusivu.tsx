import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Alue } from "./alueet";
import type { Sijainti } from "../../lib/geolocation";
import { etaisyysMetreina, etenemisprosentti } from "../etsi/distance";
import { ALUE_AVAUTUU_METREINA, ALUE_TUTKA_METREINA } from "../etsi/kynnykset";
import { omaSijaintiIkoni, oletusIkoni } from "./leafletIkonit";

interface EtusivuProps {
  alueet: Alue[];
  sijainti: Sijainti | null;
  onValitseAlue: (alue: string) => void;
}

function SovitaKarttaAlueisiin({
  alueet,
  sijainti,
}: {
  alueet: Alue[];
  sijainti: Sijainti | null;
}) {
  const kartta = useMap();

  useEffect(() => {
    if (alueet.length === 0) return;
    const pisteet: L.LatLngTuple[] = alueet.map((alue) => [
      alue.keskipiste.lat,
      alue.keskipiste.lng,
    ]);
    if (sijainti) pisteet.push([sijainti.lat, sijainti.lng]);
    const rajat = L.latLngBounds(pisteet);
    kartta.fitBounds(rajat, { padding: [40, 40], maxZoom: 13 });
  }, [kartta, alueet, sijainti]);

  return null;
}

export function Etusivu({ alueet, sijainti, onValitseAlue }: EtusivuProps) {
  const [vihjeViesti, setVihjeViesti] = useState<string | null>(null);

  function valitseAlueKartalta(alue: Alue) {
    if (!sijainti) {
      setVihjeViesti("Odotetaan sijaintia…");
      return;
    }

    const etaisyys = etaisyysMetreina(sijainti, alue.keskipiste);
    if (etaisyys <= ALUE_AVAUTUU_METREINA) {
      setVihjeViesti(null);
      onValitseAlue(alue.alue);
    } else {
      setVihjeViesti(`Tule lähemmäs aluetta "${alue.alue}" avataksesi sen`);
    }
  }

  return (
    <section className="aluelista">
      <h2>Alueet</h2>
      {!sijainti && <p className="tyhja-tila">Haetaan sijaintia…</p>}

      {alueet.length > 0 && (
        <div className="karttakontti yleiskarttakontti">
          <MapContainer style={{ height: "100%", width: "100%" }} center={[0, 0]} zoom={13}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <SovitaKarttaAlueisiin alueet={alueet} sijainti={sijainti} />
            {alueet.map((alue) => (
              <Marker
                key={alue.alue}
                position={[alue.keskipiste.lat, alue.keskipiste.lng]}
                icon={oletusIkoni}
                eventHandlers={{ click: () => valitseAlueKartalta(alue) }}
              />
            ))}
            {sijainti && (
              <Marker position={[sijainti.lat, sijainti.lng]} icon={omaSijaintiIkoni} />
            )}
          </MapContainer>
        </div>
      )}

      {vihjeViesti && (
        <p className="vihje-tooltip" role="status">
          {vihjeViesti}
        </p>
      )}
      <ul className="alueet">
        {alueet.map((alue) => {
          const etaisyys = sijainti ? etaisyysMetreina(sijainti, alue.keskipiste) : null;
          const avoinna = etaisyys !== null && etaisyys <= ALUE_AVAUTUU_METREINA;
          const etenema =
            etaisyys !== null
              ? etenemisprosentti(etaisyys, ALUE_AVAUTUU_METREINA, ALUE_TUTKA_METREINA)
              : 0;

          const sisalto = (
            <>
              <span className="alue-nimi">{alue.alue}</span>
              <span className="alue-etaisyys">
                {etaisyys !== null ? `${Math.round(etaisyys)} m` : "…"}
              </span>
              {sijainti && (
                <span
                  className="alue-edistyminen"
                  role="progressbar"
                  aria-label={`Etäisyys alueeseen ${alue.alue}`}
                  aria-valuenow={Math.round(etenema * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className="alue-edistyminen-tayte"
                    style={{ width: `${etenema * 100}%` }}
                  />
                </span>
              )}
            </>
          );

          return (
            <li key={alue.alue} className={`alue-rivi ${avoinna ? "avoinna" : "lukittu"}`}>
              {avoinna ? (
                <button
                  type="button"
                  className="alue-linkki"
                  onClick={() => onValitseAlue(alue.alue)}
                >
                  {sisalto}
                </button>
              ) : (
                <div className="alue-linkki alue-linkki-poissa">{sisalto}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
