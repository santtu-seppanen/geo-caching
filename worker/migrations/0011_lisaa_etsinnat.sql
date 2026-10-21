-- Käynnissä olevat etsinnät tilannekuvanäkymää (/tilannekuva) varten.
-- Pelaajan oma etsintätila asuu edelleen laitteella (localStorage, ks.
-- app/src/features/pelimoodit/pelitila.ts) — tämä on vain ilmoitus muille
-- siitä, että joku on aloittanut alueen etsinnän. Yksi rivi per laite ja
-- alue: uusi aloitus korvaa vanhan, kuten laitteellakin. Avaimena laitteen
-- satunnainen tunniste, koska nimimerkki voi vielä puuttua aloitushetkellä.
CREATE TABLE etsinnat (
  laite_id TEXT NOT NULL,
  alue_avain TEXT NOT NULL,
  nimi TEXT,
  alkoi TEXT NOT NULL,
  PRIMARY KEY (laite_id, alue_avain)
);
