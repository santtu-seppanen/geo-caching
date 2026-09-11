import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerKuva from "leaflet/dist/images/marker-icon.png";
import markerKuva2x from "leaflet/dist/images/marker-icon-2x.png";
import varjoKuva from "leaflet/dist/images/marker-shadow.png";

// Vite ei pakkaa Leafletin oletusikonien polkuja automaattisesti oikein,
// joten ne pitää asettaa käsin — muuten markerit näkyvät rikkinäisinä.
L.Icon.Default.mergeOptions({
  iconUrl: markerKuva,
  iconRetinaUrl: markerKuva2x,
  shadowUrl: varjoKuva,
});

// Aina eksplisiittinen ikoni Markereille — react-leaflet siirtää `icon`-propin
// suoraan Leafletin optioihin, joten `icon={undefined}` ylikirjoittaisi
// Leafletin sisäänrakennetun oletuksen ja kaataisi kartan renderöinnin.
export const oletusIkoni = new L.Icon.Default();

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
