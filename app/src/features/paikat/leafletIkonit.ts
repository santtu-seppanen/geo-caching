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

export const omaSijaintiIkoni = L.divIcon({
  className: "oma-sijainti-merkki",
  html: '<span class="oma-sijainti-piste"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
