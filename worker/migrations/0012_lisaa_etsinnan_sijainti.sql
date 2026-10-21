-- Etsijän viimeisin sijainti tilannekuvaa varten. Laite lähettää sen
-- vain etsinnän ollessa käynnissä (ks. app/src/features/pelimoodit/
-- useSijainninJako.ts); rivi poistuu muiden mukana takarajan jälkeen.
ALTER TABLE etsinnat ADD COLUMN lat REAL;
ALTER TABLE etsinnat ADD COLUMN lng REAL;
ALTER TABLE etsinnat ADD COLUMN sijainti_aika TEXT;
