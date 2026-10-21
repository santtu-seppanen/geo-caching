import { useEffect, useMemo, useState } from "react";
import { LAATTA_ATTRIBUUTIO, LAATTA_MAX_ZOOM, LAATTA_URL } from "../../lib/karttalaatat";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { alueenLoydettyjenMaara, normalisoiAlueNimi, ryhmitteleAlueiksi, yhdistaKaikkiSamannimiset } from "../paikat/alueet";
import { haeLoydot, haePaikat } from "../paikat/paikatApi";
import type { Loyto, Paikka } from "../paikat/types";
import { Edistymispalkki } from "../paikat/Edistymispalkki";
import { loydettyIkoni, oletusIkoni } from "../paikat/leafletIkonit";
import { haeKaynnissaOlevatEtsinnat, type KaynnissaOlevaEtsinta } from "../pelimoodit/etsinnatApi";
import { useNyt } from "../pelimoodit/usePelitila";
import { alueenMestarit, MITALI_EMOJI } from "../tilastot/tilastoLaskenta";
import {
  etsintaRivit,
  katkoRivit,
  muotoileIka,
  muotoileKesto,
  ryhmitteleAlueittain,
  SIJAINTI_VANHENTUNUT_MS,
  valitseAlue,
  type EtsintaRivi,
} from "./tilannekuvaLaskenta";
import { etaisyysMetreina } from "../etsi/distance";
import { ALUE_AVAUTUU_METREINA } from "../etsi/kynnykset";

/** Kuinka usein telkkari hakee tuoreet löydöt ja etsinnät. */
const PAIVITYS_MS = 15_000;

/**
 * Sovittaa kartan kätköihin ja etsijöihin. Sovitetaan uudelleen vain kun
 * pisteiden joukko muuttuu (ei jokaisella sijaintipäivityksellä), ettei
 * kartta nyi 15 s välein.
 */
function SovitaKartta({ pisteet, avain }: { pisteet: { lat: number; lng: number }[]; avain: string }) {
  const kartta = useMap();

  useEffect(() => {
    const rajat = L.latLngBounds(pisteet.map((p) => [p.lat, p.lng] as [number, number]));
    if (rajat.isValid()) kartta.fitBounds(rajat, { padding: [60, 60], maxZoom: 17 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avain kattaa pisteet
  }, [kartta, avain]);

  return null;
}

function etsijaIkoni(rivi: EtsintaRivi): L.DivIcon {
  const vanha = (rivi.sijainti?.ikaMs ?? 0) > SIJAINTI_VANHENTUNUT_MS;
  const nimi = (rivi.nimi ?? "Nimetön").replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`);
  return L.divIcon({
    className: `etsija-merkki${vanha ? " vanha" : ""}`,
    html: `<span class="etsija-piste"></span><span class="etsija-nimi">${nimi}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Telkkarinäkymä (/tilannekuva): käynnissä olevat etsinnät ja valitun
 * alueen kaikki kätköt löytäjineen. Ei sijaintia, hakua eikä
 * löytölomaketta — pelkkä katselunäkymä, joka päivittyy itsestään. Alueen
 * voi valita vain käynnissä olevien etsintöjen listasta, jottei näkymä
 * paljasta alueita, joilla kukaan ei pelaa.
 */
export function Tilannekuva() {
  const [paikat, setPaikat] = useState<Paikka[]>([]);
  const [loydot, setLoydot] = useState<Loyto[]>([]);
  const [etsinnat, setEtsinnat] = useState<KaynnissaOlevaEtsinta[]>([]);
  const [ladattu, setLadattu] = useState(false);
  const [virhe, setVirhe] = useState(false);
  const [valittuAvain, setValittuAvain] = useState<string | null>(null);
  const nyt = useNyt(1000, true);

  useEffect(() => {
    let peruttu = false;

    async function paivita() {
      try {
        const [uudetPaikat, uudetLoydot, uudetEtsinnat] = await Promise.all([
          haePaikat(),
          haeLoydot(),
          haeKaynnissaOlevatEtsinnat(),
        ]);
        if (peruttu) return;
        setPaikat(uudetPaikat);
        setLoydot(uudetLoydot);
        setEtsinnat(uudetEtsinnat);
        setVirhe(false);
      } catch {
        // Edellinen data jää näkyviin; yritetään seuraavalla kierroksella uudelleen.
        if (!peruttu) setVirhe(true);
      } finally {
        if (!peruttu) setLadattu(true);
      }
    }

    paivita();
    const ajastin = setInterval(paivita, PAIVITYS_MS);
    return () => {
      peruttu = true;
      clearInterval(ajastin);
    };
  }, []);

  const alueet = useMemo(() => yhdistaKaikkiSamannimiset(ryhmitteleAlueiksi(paikat)), [paikat]);
  const rivit = etsintaRivit(etsinnat, alueet, loydot, nyt);
  const ryhmat = ryhmitteleAlueittain(rivit);
  // Vain takarajan sisällä olevat etsinnät (worker suodattaa, mutta rivi voi vanhentua pollausten välissä).
  const alue = valitseAlue(
    alueet,
    valittuAvain,
    etsinnat.filter((e) => rivit.some((r) => r.alueAvain === e.alueAvain)),
  );
  const alueAvain = alue ? normalisoiAlueNimi(alue.nimi) : null;
  const alueenEtsijat = rivit.filter((r) => r.alueAvain === alueAvain && r.sijainti);
  // Kartta sovitetaan kätköihin ja alueen lähellä oleviin etsijöihin — kaukana
  // (esim. vielä kotona) olevat näkyvät listassa, mutta eivät loitonna karttaa.
  const sovitusPisteet = alue
    ? [
        ...alue.paikat,
        ...alueenEtsijat
          .map((r) => r.sijainti!)
          .filter((s) => etaisyysMetreina(s, alue.keskipiste) <= ALUE_AVAUTUU_METREINA),
      ]
    : [];
  const sovitusAvain = `${alueAvain}|${alue?.paikat.length}|${sovitusPisteet.length}`;
  const katkot = useMemo(() => (alue ? katkoRivit(alue, loydot) : []), [alue, loydot]);
  const loydetytIdt = useMemo(() => new Set(loydot.map((l) => l.paikkaId)), [loydot]);
  const mestarit = useMemo(
    () => (alue ? alueenMestarit(new Set(alue.paikat.map((p) => p.id)), loydot) : null),
    [alue, loydot],
  );

  const kello = new Date(nyt).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="tilannekuva">
      <header className="tilannekuva-otsikko">
        <h1>
          Viinakätköily · <span>{alue ? alue.nimi : "Tilannekuva"}</span>
        </h1>
        {virhe && <span className="tilannekuva-virhe">Yhteys katkennut — näytetään viimeisin tieto</span>}
        <span className="tilannekuva-kello">{kello}</span>
      </header>

      {!ladattu ? (
        <p className="tyhja-tila">Ladataan…</p>
      ) : (
        <div className="tilannekuva-sisalto">
          <section className="tilannekuva-kartta">
            {alue ? (
              <MapContainer
                center={[alue.keskipiste.lat, alue.keskipiste.lng]}
                zoom={15}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url={LAATTA_URL}
                  attribution={LAATTA_ATTRIBUUTIO}
                  maxZoom={LAATTA_MAX_ZOOM}
                />
                <SovitaKartta pisteet={sovitusPisteet} avain={sovitusAvain} />
                {katkot.map(({ paikka }, indeksi) => (
                  <Marker
                    key={paikka.id}
                    position={[paikka.lat, paikka.lng]}
                    icon={loydetytIdt.has(paikka.id) ? loydettyIkoni : oletusIkoni}
                  >
                    <Tooltip permanent direction="top" offset={[0, -36]} className="tilannekuva-merkki">
                      {indeksi + 1}
                    </Tooltip>
                  </Marker>
                ))}
                {alueenEtsijat.map((rivi, indeksi) => (
                  <Marker
                    key={`etsija-${rivi.nimi ?? "?"}-${indeksi}`}
                    position={[rivi.sijainti!.lat, rivi.sijainti!.lng]}
                    icon={etsijaIkoni(rivi)}
                    zIndexOffset={1000}
                  />
                ))}
              </MapContainer>
            ) : (
              <p className="tilannekuva-tyhja">Ei käynnissä olevia etsintöjä.</p>
            )}
          </section>

          <aside className="tilannekuva-sivupalkki">
            <section>
              <h2>Käynnissä olevat etsinnät</h2>
              {ryhmat.length === 0 ? (
                <p className="tyhja-tila">Kukaan ei etsi juuri nyt.</p>
              ) : (
                ryhmat.map((ryhma) => (
                  <div
                    key={ryhma.alueAvain}
                    className={`tilannekuva-ryhma${ryhma.alueAvain === alueAvain ? " valittu" : ""}`}
                  >
                    <button
                      type="button"
                      className="tilannekuva-ryhma-nimi"
                      aria-pressed={ryhma.alueAvain === alueAvain}
                      onClick={() => setValittuAvain(ryhma.alueAvain)}
                    >
                      {ryhma.alueNimi} <small>({ryhma.rivit.length})</small>
                    </button>
                    <ul className="tilannekuva-etsinnat">
                      {ryhma.rivit.map((rivi, indeksi) => (
                        <li key={`${rivi.nimi ?? "?"}-${indeksi}`}>
                          <span className="etsija">{rivi.nimi ?? "Nimetön etsijä"}</span>
                          <span className="etsinnan-aika">
                            ⏱ {muotoileKesto(rivi.kulunutMs)}
                            <small> (jäljellä {muotoileKesto(rivi.jaljellaMs)})</small>
                          </span>
                          <span className="etsinnan-sijainti">
                            {rivi.sijainti ? `📍 ${muotoileIka(rivi.sijainti.ikaMs)}` : "📍 ei sijaintia"}
                          </span>
                          {rivi.loydetty !== null && (
                            <span className="etsinnan-loydot">
                              {rivi.loydetty} / {rivi.yhteensa} löydetty
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>

            {alue && (
              <section>
                <h2>Kätköt</h2>
                <Edistymispalkki
                  loydetty={alueenLoydettyjenMaara(alue, loydetytIdt)}
                  yhteensa={alue.paikat.length}
                  teksti="kätköä löydetty"
                />
                {mestarit && mestarit.maara > 0 && (
                  <p className="alueen-mestari">
                    👑 Alueen mestari: {mestarit.nimet.join(", ")} ({mestarit.maara} kätköä)
                  </p>
                )}
                <ol className="tilannekuva-katkot">
                  {katkot.map(({ paikka, loytajat }) => (
                    <li key={paikka.id} className={loytajat.length > 0 ? "loydetty" : undefined}>
                      {loytajat.length === 0 ? (
                        <span className="tyhja-tila">Löytämättä</span>
                      ) : (
                        loytajat.map((l) => (
                          <span key={l.nimi} className="loytaja">
                            {l.mitali ? `${MITALI_EMOJI[l.mitali]} ` : ""}
                            {l.nimi}
                          </span>
                        ))
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
