-- Löytäjän vapaaehtoinen lyhyt kommentti (enintään KOMMENTTI_MAX_PITUUS
-- merkkiä, ks. worker/src/validointi.ts). NULL jos ei jätetty.
ALTER TABLE loydot ADD COLUMN kommentti TEXT;
