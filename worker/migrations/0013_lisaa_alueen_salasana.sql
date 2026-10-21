-- Alueen oma admin-salasana (PBKDF2-hash, ks. worker/src/alueSalasana.ts).
-- Kuka tahansa voi luoda uuden alueen salasanalla, joka avaa adminin vain
-- sille alueelle; ADMIN_SALASANA (master) avaa edelleen kaiken. NULL =
-- alueella ei omaa salasanaa (vanhat alueet), vain master voi hallita sitä.
ALTER TABLE alueet ADD COLUMN salasana_hash TEXT;
