-- Aikarajattu yhteishaaste: tasan yksi aktiivinen haaste (id on aina 1).
-- Edistymistä ei tallenneta — client laskee sen `loydot.aika`-kentästä
-- (montako eri kätköä on löydetty välillä alku–loppu).
CREATE TABLE haaste (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nimi TEXT NOT NULL,
  alku TEXT NOT NULL,
  loppu TEXT NOT NULL,
  tavoite INTEGER NOT NULL
);
