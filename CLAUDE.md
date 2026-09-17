# paikka-hälytin ("Viinakätköily")

Geokätköilytyylinen sovellus pienelle ryhmälle: kätköt on esiladattu
alueittain, ne avautuvat kartalla sitä mukaa kun käyttäjä liikkuu
lähemmäs, ja löytäjä voi jättää nimensä kätkön yhteyteen.

- Etusivu ei listaa kaikkia alueita — kätköt on piilossa, kunnes käyttäjä
  kirjoittaa hakukenttään alueen nimen. Kätkön id on kaksiosainen, teksti +
  numero (esim. `neittava-1`, `neittava-2`), ja id sallii vain
  `a-z0-9-`-merkkejä (R2-tiedostonimenä ja D1-avaimena, ks. alla) — id:n
  tekstiosa on siis pelkkä hakuun/ryhmittelyyn käytetty ascii-tunniste, ei
  näytettävä nimi. Kirjoittamalla sen (esim. "Neittävä", normalisoituna
  ääkkösettä) näkee kaikki sen alueen kätköt kartalla — ei etäisyysrajaa
  hakukentän kautta (ks. `app/src/features/paikat/alueet.ts`:n
  `paikanTunniste`). Käyttäjälle **näytettävä** alueen nimi (voi sisältää
  ääkköset, esim. "Äpätti") tulee kätkön omasta `alue`-kentästä (ks.
  `Alue.nimi` / `LahellaOlevaAlue.nimi`) — älä koskaan johda näytettävää
  nimeä id:stä. `/admin`-lomakkeella admin kirjoittaa vain tämän
  `alue`-nimen; id (tunniste + juokseva numero) johdetaan siitä
  automaattisesti eikä ole admin-lomakkeella muokattavissa suoraan (ks.
  `alueTunnisteeksi` ja `seuraavaVapaaNumero`). Lisäksi etusivu näyttää
  aina lähimmän alueen nimen,
  etäisyyden ja suunnan (ks. `app/src/features/etsi/laheisinAlue.ts`),
  mutta sen kartan voi avata vasta **`ALUE_AVAUTUU_METREINA`** (2000 m)
  sisällä — kauempaa näkyy vain vihje, ei kätkön sisältöä.
- Aluesivu näyttää Leaflet/OpenStreetMap-kartan alueen kätköistä ja
  käyttäjän omasta sijainnista. Kätkön kuva ja kuvaus paljastuvat vasta
  **100 m** sisällä (ks. `app/src/features/etsi/`), jottei kartta
  itsessään spoilaa kätköä.
- Löytö (nimi + ajankohta) kirjataan `worker/`-Cloudflare Workerin kautta
  Cloudflare D1 -tietokantaan — ks. Arkkitehtuuri alla.

## Arkkitehtuuri lyhyesti

- **Vaihe 1 (nyt): PWA.** `app/` on Vite + React + TypeScript -sovellus, joka
  toimii selaimessa ja on asennettavissa PWA:na. Sijainti haetaan
  `navigator.geolocation`-rajapinnalla.
- **Vaihe 2 (myöhemmin): Capacitor.** Kun taustapaikannus (sovellus kiinni,
  puhelin taskussa) tulee tarpeelliseksi, sama `app/`-koodikanta pakataan
  Capacitorilla natiiviksi Android/iOS-sovellukseksi ja taustapaikannus
  toteutetaan natiiviplugareilla. Ks. `docs/architecture.md` ja
  `docs/decisions/0001-capacitor-vs-react-native.md`.
- **Data asuu Cloudflaressa, ei gitissä.** `worker/` on ainoa "backend"-osa
  ja ainoa taho joka lukee/kirjoittaa dataa. Frontend (`app/`) hakee kaiken
  ajonaikaisesti Workerin API:sta — `app/src/data/`-hakemistoa ei enää ole,
  eikä kätkö- tai löytödataa bundlata JS:ään build-aikana.
  - **Cloudflare D1** (SQLite-pohjainen SQL-tietokanta) — taulut `paikat`
    ja `loydot`, ks. `worker/migrations/`. Skeema ja alkudata viedään
    tietokantaan `wrangler d1 migrations apply`-komennolla, ei käsin
    kirjoitetulla JSON:illa.
  - **Cloudflare R2** (objektivarasto) — kätkön kuvat. Worker tarjoilee ne
    `GET /kuvat/:tiedostonimi`-reitin kautta, joten frontend rakentaa
    kuvan URL:n `${VITE_LOYTO_API_URL}/kuvat/<tiedosto>`.
  - **Uuden kätkön lisääminen tai poisto** tapahtuu `/admin`-sivun
    lomakkeella (ks. `app/src/features/admin/`), joka kutsuu Workerin
    `POST /admin/luo-katko`- ja `POST /admin/poista-katko`-reittejä.
    Käsin muokattavaa JSON-tiedostoa ei enää ole.
- **`worker/` — Cloudflare Worker, koko sovelluksen backend.** Reitit:
  - `GET /paikat`, `GET /loydot` — palauttavat kaiken kätkö-/löytödatan
    JSON:ina D1:stä. Julkisia, ei vaadi salasanaa (data oli aiemminkin
    kaikille näkyvässä JS-bundlessa, joten tämä ei ole regressio).
  - `GET /kuvat/:tiedostonimi` — striimaa kuvan R2:sta oikealla
    `Content-Type`-headerilla.
  - `POST /loyda` — validoi pyynnön (tunnettu `paikkaId`, nimi ei
    tyhjä/liian pitkä), tarkistaa jaetun salasanan
    (`X-Jaettu-Salasana`-header — karsii botteja, ei oikea autentikointi)
    ja lisää rivin `loydot`-tauluun.
  - `POST /admin/luo-katko` — validoi uuden kätkön kentät (id, alue,
    kuvaus, lat/lng, kuva base64:na), tarkistaa admin-salasanan
    (`X-Admin-Salasana`-header, eri salaisuus kuin löytöjen jaettu
    salasana koska tämä kirjoittaa sisältöä eikä vain lokita löytöä),
    tallentaa kuvan R2:een ja lisää rivin `paikat`-tauluun.
  - `POST /admin/poista-katko` — sama admin-salasana, poistaa kätkön
    (ja sen löydöt) D1:stä sekä sen kuvan R2:sta.
  - Toisin kuin `VITE_LOYTO_SALASANA`, admin-salasanaa **ei** upoteta
    build-aikana bundleen (kuka tahansa voisi lukea sen sivun lähdekoodista)
    — käyttäjä syöttää sen `/admin`-lomakkeeseen käyttökerralla.
  - **Käyttöönotto (tekee käyttäjä itse, ei automatisoitu):**
    `cd worker && ./deploy.sh` (tai `npm run setup`) — yksi skripti joka
    hoitaa kirjautumisen, D1-tietokannan ja R2-kuvavaraston luonnin (jos
    eivät jo olemassa), `database_id`:n kirjoittamisen `wrangler.toml`:iin,
    migraatioiden ajon, salaisuuksien kysymisen (jos eivät jo asetettu) ja
    lopuksi deployn. Turvallinen ajaa uudelleen. Tulostaa lopuksi Workerin
    URL:n, joka pitää asettaa `VITE_LOYTO_API_URL`-build-time-env-
    muuttujaksi (ks. `app/.env.local.example`) sekä paikalliseen
    kehitykseen että GitHub Actions -buildiin — sama URL palvelee kaikkia
    reittejä. Pelkkä uusi deploy ilman provisiointia: `npm run deploy`.

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

Sovellus hakee kaiken kätkö-/löytödatan ajonaikaisesti Workerista, joten
Workerin täytyy olla käynnissä myös silloin kun vain selaat karttaa (ei
pelkästään löytö-flow'ta testatessa):

```bash
# worker (paikallinen D1/R2, ei vaadi Cloudflare-tiliä)
cd worker && npm install
npx wrangler d1 migrations apply paikka-halytin-db --local
npm run dev

# frontend, toisessa terminaalissa — .env.local:in VITE_LOYTO_API_URL
# pitää osoittaa paikalliseen workeriin (esim. http://localhost:8787)
cd app && npm install && npm run dev
```
