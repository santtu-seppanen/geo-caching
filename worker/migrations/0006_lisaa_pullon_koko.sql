-- Valinnainen tieto pullon koosta millilitroina. Vanhoille kätköille NULL
-- (tieto ei ole pakollinen luontihetkellä), admin voi täyttää sen
-- myöhemmin muokkauslomakkeella.
ALTER TABLE paikat ADD COLUMN pullon_koko_ml INTEGER;
