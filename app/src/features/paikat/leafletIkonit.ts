import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerKuva from "leaflet/dist/images/marker-icon.png";
import markerKuva2x from "leaflet/dist/images/marker-icon-2x.png";
import varjoKuva from "leaflet/dist/images/marker-shadow.png";

// L.icon() eikä new L.Icon.Default(): Icon.Default._getIconUrl liittää
// automaattisesti tunnistetun imagePath-etuliitteen jo-absoluuttisten
// Vite-URLien eteen, mikä rikkoo markerin kuvan (kaksinkertainen polku,
// näkyy erityisesti retina-näytöillä). L.icon() käyttää annetut URLit
// sellaisenaan.
//
// Aina eksplisiittinen ikoni Markereille — react-leaflet siirtää `icon`-propin
// suoraan Leafletin optioihin, joten `icon={undefined}` ylikirjoittaisi
// Leafletin sisäänrakennetun oletuksen ja kaataisi kartan renderöinnin.
export const oletusIkoni = L.icon({
  iconUrl: markerKuva,
  iconRetinaUrl: markerKuva2x,
  shadowUrl: varjoKuva,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

export const omaSijaintiIkoni = L.divIcon({
  className: "oma-sijainti-merkki",
  html: '<span class="oma-sijainti-piste"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const loydettyIkoni = L.divIcon({
  className: "loydetty-merkki",
  html: '<span class="loydetty-piste">✓</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
