# paikka-hälytin ("Viinakätköily")

Geokätköilytyylinen sovellus pienelle ryhmälle: kätköt on esiladattu
alueittain, ne avautuvat kartalla sitä mukaa kun käyttäjä liikkuu
lähemmäs, ja löytäjä voi jättää nimensä kätkön yhteyteen.

- Etusivu listaa **alueet** karkealla vihjeellä ja live-etäisyydellä.
  Alue avautuu tarkempaan näkymään, kun käyttäjä on **2 km** sisällä.
- Aluesivu näyttää Leaflet/OpenStreetMap-kartan alueen kätköistä ja
  käyttäjän omasta sijainnista. Kätkön kuva ja kuvaus paljastuvat vasta
  **100 m** sisällä (ks. `app/src/features/etsi/`), jottei kartta
  itsessään spoilaa kätköä.
- Löytö (nimi + ajankohta) kirjataan `worker/`-Cloudflare Workerin kautta
  suoraan gitiin — ks. Arkkitehtuuri alla.

## Arkkitehtuuri lyhyesti

- **Vaihe 1 (nyt): PWA.** `app/` on Vite + React + TypeScript -sovellus, joka
  toimii selaimessa ja on asennettavissa PWA:na. Sijainti haetaan
  `navigator.geolocation`-rajapinnalla.
- **Vaihe 2 (myöhemmin): Capacitor.** Kun taustapaikannus (sovellus kiinni,
  puhelin taskussa) tulee tarpeelliseksi, sama `app/`-koodikanta pakataan
  Capacitorilla natiiviksi Android/iOS-sovellukseksi ja taustapaikannus
  toteutetaan natiiviplugareilla. Ks. `docs/architecture.md` ja
  `docs/decisions/0001-capacitor-vs-react-native.md`.
- **Data on staattista, ei backendiä.** Ryhmä on pieni ja kätköt pysyvät
  käytännössä muuttumattomina, joten niitä ei tallenneta tietokantaan vaan
  ne asuvat gitissä hand-authored JSON:ina:
  - `app/src/data/paikat.json` — kätköt (alue, vihje, kuvaus, sijainti,
    kuva). Muokataan käsin, committoidaan, `deploy-pages.yml` julkaisee
    uuden version automaattisesti push:lla `main`-haaraan.
  - `app/src/data/loydot.json` — löydöt (kätkön id, löytäjän nimi,
    ajankohta). Ei muokata käsin; ainoa kirjoittaja on `worker/`.
  - Kuvat: `app/public/kuvat/`.
  - **Uuden kätkön lisääminen:** muokkaa `paikat.json`, lisää kuva
    `app/public/kuvat/`-kansioon, committoi ja pushaa `main`-haaraan.
- **`worker/` — Cloudflare Worker löytöjen kirjaamiseen.** Ainoa
  "backend"-osa: yksi `POST /loyda`-endpoint, joka validoi pyynnön
  (tunnettu `paikkaId`, nimi ei tyhjä/liian pitkä), tarkistaa jaetun
  salasanan (`X-Jaettu-Salasana`-header — karsii botteja, ei oikea
  autentikointi) ja kirjoittaa uuden löydön `loydot.json`-tiedostoon
  GitHub Contents API:n kautta. GitHub-token on Workerin salaisuus
  (`wrangler secret put GITHUB_TOKEN`), ei koskaan selaimessa. Commit
  `main`-haaraan laukaisee automaattisen Pages-buildin, joten löytö
  näkyy kaikille muutamassa minuutissa.
  - Käyttöönotto (tekee käyttäjä itse, ei automatisoitu):
    `cd worker && npm install`, sitten
    `wrangler secret put GITHUB_TOKEN` (fine-grained PAT, vain tälle
    repolle, contents read/write), `wrangler secret put JAETTU_SALASANA`,
    ja `npm run deploy`. Frontend tarvitsee Workerin URL:n
    `VITE_LOYTO_API_URL`-build-time-env-muuttujana (ks.
    `app/.env.local.example`) sekä paikalliseen kehitykseen että
    GitHub Actions -buildiin.

## Konventiot

- TypeScript strict-tilassa sekä `app/`:ssa että `worker/`:ssa.
- Frontend jäsennelty feature-kansioihin (`src/features/<ominaisuus>/`), ei
  tyyppikohtaisiin kansioihin (`components/`, `hooks/` jne. sekoitettuna).
  - `features/paikat/` — kätködata (tyypit, aluejaottelu/keskipisteet).
  - `features/etsi/` — etäisyyslaskenta ja avautumiskynnykset
    (`KATKO_AVAUTUU_METREINA`, `ALUE_AVAUTUU_METREINA`).
- Jaettu, ominaisuuksista riippumaton koodi menee `src/lib/`:iin
  (esim. `lib/geolocation.ts`).
- Älä lisää abstraktioita tai konfiguraatiota, joita ei tarvita nyt (esim.
  taustapaikannus-native-koodia ei kirjoiteta ennen kuin vaihe 2 alkaa
  oikeasti).

## Subagentit (`.claude/agents/`)

Työ on jaettu vastuualueittain, jotta kukin subagentti pysyy fokusoituna:

| Agentti | Vastuu |
|---|---|
| `mobile-agent` | UI, kartta, sijainnin käyttöliittymä (`app/`, pl. taustapaikannus) |
| `geofencing-agent` | Taustapaikannus, geofencing-logiikka, native-liitännät |
| `qa-agent` | Testit (yksikkö-, integraatio-, e2e) |

`worker/`-Cloudflare Workerille ei ole omaa subagenttia — se on pieni ja
riittävän harvoin muuttuva, että sitä muokataan suoraan.

Mallivalinnat subagenteille on kunkin agentin omassa frontmatterissa
(`model:`-kenttä) — halvempia malleja käytetään yksinkertaisiin, hyvin
rajattuihin tehtäviin (esim. testien kirjoitus), tehokkaampia
arkkitehtuuripäätöksiin ja geofencing-logiikkaan.

## Ajaminen paikallisesti

```bash
# frontend
cd app && npm install && npm run dev

# worker (löytöjen kirjaus, tarvitaan vain jos testaat löytö-flow'ta)
cd worker && npm install && npm run dev
```
