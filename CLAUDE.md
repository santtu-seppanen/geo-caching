# paikka-hälytin

Sovellus, jolla käyttäjä tallentaa paikkoja (sijainti + kuva + kuvaus) ja saa
hälytyksen, kun hän myöhemmin liikkuu tallennetun paikan lähelle.

## Arkkitehtuuri lyhyesti

- **Vaihe 1 (nyt): PWA.** `app/` on Vite + React + TypeScript -sovellus, joka
  toimii selaimessa ja on asennettavissa PWA:na. Sijainti haetaan
  `navigator.geolocation`-rajapinnalla.
- **Vaihe 2 (myöhemmin): Capacitor.** Kun taustapaikannus (sovellus kiinni,
  puhelin taskussa) tulee tarpeelliseksi, sama `app/`-koodikanta pakataan
  Capacitorilla natiiviksi Android/iOS-sovellukseksi ja taustapaikannus
  toteutetaan natiiviplugareilla. Ks. `docs/architecture.md` ja
  `docs/decisions/0001-capacitor-vs-react-native.md`.
- **Backend.** `backend/` on Node/Express/TypeScript-API, joka tallentaa
  paikat (sijainti, kuvaus, kuva) SQLite-tietokantaan ja tarjoaa ne
  frontendille. Tuotannossa tietokanta ja kuvatallennus voidaan vaihtaa
  hallitumpaan ratkaisuun (esim. Postgres + S3-yhteensopiva objektivarasto)
  ilman, että API-rajapinta muuttuu.

## Konventiot

- TypeScript strict-tilassa sekä backendissä että frontendissä.
- Frontend jäsennelty feature-kansioihin (`src/features/<ominaisuus>/`), ei
  tyyppikohtaisiin kansioihin (`components/`, `hooks/` jne. sekoitettuna).
  - `features/paikat/` — paikan tallennus (sijainti + kuva + kuvaus).
  - `features/etsi/` — etäisyyslaskenta ja hälytysloogiikka.
- Jaettu, ominaisuuksista riippumaton koodi menee `src/lib/`:iin
  (esim. `lib/geolocation.ts`).
- Älä lisää abstraktioita tai konfiguraatiota, joita ei tarvita nyt (esim.
  taustapaikannus-native-koodia ei kirjoiteta ennen kuin vaihe 2 alkaa
  oikeasti).

## Subagentit (`.claude/agents/`)

Työ on jaettu vastuualueittain, jotta kukin subagentti pysyy fokusoituna:

| Agentti | Vastuu |
|---|---|
| `backend-agent` | API, tietokanta, kuvatallennus (`backend/`) |
| `mobile-agent` | UI, kartta, sijainnin käyttöliittymä (`app/`, pl. taustapaikannus) |
| `geofencing-agent` | Taustapaikannus, geofencing-logiikka, native-liitännät |
| `qa-agent` | Testit (yksikkö-, integraatio-, e2e) |

Mallivalinnat subagenteille on kunkin agentin omassa frontmatterissa
(`model:`-kenttä) — halvempia malleja käytetään yksinkertaisiin, hyvin
rajattuihin tehtäviin (esim. testien kirjoitus), tehokkaampia
arkkitehtuuripäätöksiin ja geofencing-logiikkaan.

## Ajaminen paikallisesti

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd app && npm install && npm run dev
```
