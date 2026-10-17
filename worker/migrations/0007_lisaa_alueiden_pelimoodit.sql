-- Alueen pelimoodi (ks. app/src/features/pelimoodit/). Alueita ei ole
-- omana taulunaan (alue johdetaan kätköjen `alue`-kentästä), joten tämä
-- taulu sisältää vain alueet, joille admin on asettanut muun kuin
-- oletusmoodin. Avain on normalisoitu näytettävä nimi (ks. frontendin
-- normalisoiAlueNimi), jotta "Äpätti" ja "apatti" osuvat samaan riviin.
CREATE TABLE alueet (
  alue_avain TEXT PRIMARY KEY,
  pelimoodi TEXT NOT NULL DEFAULT 'vapaa'
);
