-- Kuinka kauan löytö kesti (ms) edellisestä saman pelaajan löydöstä tai
-- etsinnän aloituksesta (ks. app/src/features/pelimoodit/etsinta.ts).
-- Clientin ilmoittama, ei varmennettu. NULL jos etsintää ei ollut
-- aloitettu tai löytö on tehty ennen tätä saraketta.
ALTER TABLE loydot ADD COLUMN kesto_ms INTEGER;
