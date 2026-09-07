# ADR 0001: Capacitor eikä React Native

## Tilanne

Tarvitaan natiivi mobiilisovellus (Android + iOS) taustapaikannusta varten
(ks. `docs/architecture.md`). Sovellus alkaa PWA:na.

## Päätös

Käytetään Capacitoria, ei React Nativea.

## Perustelut

- **Sama koodikanta jatkuu.** Capacitor pakkaa olemassa olevan web-sovelluksen
  (React + TS, mikä tahansa DOM-pohjainen UI) natiivikuoreen sellaisenaan.
  React Native taas vaatisi UI:n uudelleenkirjoituksen RN:n omilla
  komponenteilla (`View`, `Text` jne.) — PWA-vaiheen työ heitettäisiin osin
  pois.
- **Yksi tiimi, yksi UI-kerros.** Ei tarvita erillistä web- ja
  mobiili-UI-toteutusta ylläpidettäväksi rinnakkain.
- **Natiiviominaisuudet plugareina tarpeen mukaan.** Taustapaikannus ja muu
  natiivikoodi tuodaan Capacitor-plugareina (tai kirjoitetaan itse
  natiivipuolelle) vain sinne, missä web-rajapinnat eivät riitä — muu
  sovellus pysyy tavallista web-koodia.

## Hyväksytyt kompromissit

- Capacitor-sovellus ei ole yhtä "natiivin tuntuinen" suorituskyvyltään tai
  animaatioiltaan kuin täysin natiivi tai RN-sovellus. Tälle sovellukselle
  (lomake + kartta + hälytys) tämä ei ole ratkaiseva puute.
- Taustapaikannus vaatii silti alustakohtaista native-koodia tai plugareita
  riippumatta siitä, käytetäänkö Capacitoria vai RN:ää — tässä ei ole eroa
  vaihtoehtojen välillä, joten se ei ole päätöksen peruste.

## Vaihtoehdot, joita ei valittu

- **React Native**: vahvempi natiivisuorituskyky ja isompi ekosysteemi
  natiivimoduuleille, mutta vaatisi UI:n uudelleenkirjoituksen eikä hyödyntäisi
  PWA-vaiheen koodia.
- **Täysin natiivi (Kotlin/Swift erikseen)**: paras suorituskyky ja
  luotettavin taustapaikannus, mutta tuplatyö kahdella alustalla suhteessa
  tiimin kokoon/aikatauluun ei ole perusteltu.
