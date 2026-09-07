# Arkkitehtuuri: PWA → Capacitor

## Vaihe 1: PWA

`app/` on Vite + React + TypeScript, joka toimii selaimessa ja on
asennettavissa PWA:na (manifest + service worker). Sijaintia luetaan
`navigator.geolocation`-rajapinnalla (`watchPosition`), ks.
`app/src/lib/geolocation.ts`.

Tässä vaiheessa hälytys toimii **vain kun sovellus on auki ja näkyvissä**:

- Selaimet (erityisesti iOS Safari) rajoittavat tai keskeyttävät
  `watchPosition`-kutsut, kun sivu on taustalla tai näyttö lukittu.
- Ei ole olemassa web-standardia, joka herättäisi suljetun/taustalla olevan
  PWA:n sijainnin perusteella (ei geofencing-rajapintaa selaimille).
- Push-ilmoitukset (Web Push) voivat herättää sovelluksen taustalla, mutta
  itse laukaisu (sijainnin tarkistus) pitäisi silti tapahtua jossain —
  joko palvelimella (vaatii käyttäjän sijainnin säännöllisen lähetyksen,
  mikä syö akkua ja on yksityisyysongelma) tai natiivikoodissa.

Johtopäätös: PWA-vaihe riittää tallennukseen ja "etsi lähellä" -käyttöön
sovellus auki, mutta **ei riitä** taustahälytykseen.

## Vaihe 2: Capacitor + native-taustapaikannus

Kun taustahälytys (puhelin taskussa, sovellus kiinni) tulee vaatimukseksi,
`app/` pakataan Capacitorilla natiiviksi kuoreksi (ks.
`app/capacitor.config.ts` ja `docs/decisions/0001-capacitor-vs-react-native.md`
valinnan perusteluista). Web-koodi (React-komponentit, `lib/`, `features/`)
pysyy pääosin samana; taustapaikannus toteutetaan native-plugarilla
(esim. `@capacitor-community/background-geolocation` tai vastaava), joka
piiloutuu `geofencing-agent`in ylläpitämän rajapinnan taakse.

### Alustakohtaiset rajoitukset huomioitava suunnittelussa

**Android**

- Taustapalvelu vaatii `ACCESS_BACKGROUND_LOCATION`-luvan (erillinen
  käyttäjän hyväksyntä `ACCESS_FINE_LOCATION`-luvan lisäksi, Android 10+).
- Valmistajakohtainen akunsäästö (esim. Xiaomi, Huawei, Samsung) voi
  sammuttaa taustapalvelun sovelluksen tietämättä — tähän ei ole täydellistä
  ohjelmallista ratkaisua, vain käyttäjän ohjeistus poikkeuslistalle.
- Foreground service (pysyvä ilmoitus) on luotettavin tapa pitää
  paikannus hengissä pitkään, mutta näkyy käyttäjälle jatkuvana notifikaationa.

**iOS**

- Vaatii "Always" (Aina)-sijaintiluvan taustakäyttöön; Apple arvioi
  App Store -katselmuksessa tarkkaan, perustellaanko lupa oikein.
- Jatkuva tarkka taustapaikannus tyhjentää akun nopeasti ja iOS voi
  rajoittaa sitä; tarkka geofencing kannattaa toteuttaa iOS:n
  `CLCircularRegion`-pohjaisella region monitoring -rajapinnalla
  (max. 20 monitoroitua aluetta per sovellus) sen sijaan, että sijaintia
  poll:ataan jatkuvasti.
- Significant-location-change-rajapinta on akkuystävällisempi mutta
  epätarkempi (satoja metrejä) — sopii karkeaan "olet lähialueella"
  -esisuodatukseen ennen tarkempaa tarkistusta.

### Suunnitteluperiaate

Geofencing-logiikka (etäisyyslaskenta, hälytyskynnys, "onko lähellä"
-päättely) pidetään alustariippumattomana ja testattavana omassa
moduulissaan (`app/src/features/etsi/`), jotta sama logiikka toimii sekä
PWA-vaiheen `watchPosition`-datalla että myöhemmin native-plugarin
tuottamalla sijaintidatalla. Native-spesifinen koodi rajataan
`geofencing-agent`in vastuulle omaan kerrokseensa, jotta se ei vuoda
UI- tai backend-koodiin.
