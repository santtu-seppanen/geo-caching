import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { asetaHaaste, haeHaaste, type Haaste } from "../haaste/haaste";

interface HaasteAsetuksetProps {
  adminSalasana: string;
}

/** datetime-local-kentän arvo (paikallinen aika) → ISO. */
const isoksi = (paikallinen: string) => new Date(paikallinen).toISOString();

export function HaasteAsetukset({ adminSalasana }: HaasteAsetuksetProps) {
  const [nykyinen, setNykyinen] = useState<Haaste | null>(null);
  const [nimi, setNimi] = useState("");
  const [alku, setAlku] = useState("");
  const [loppu, setLoppu] = useState("");
  const [tavoite, setTavoite] = useState("10");
  const [tallennetaan, setTallennetaan] = useState(false);
  const [virhe, setVirhe] = useState<string | null>(null);

  useEffect(() => {
    haeHaaste().then(setNykyinen).catch(() => setVirhe("Haasteen lataus epäonnistui."));
  }, []);

  async function tallenna(haaste: Haaste | null) {
    setTallennetaan(true);
    setVirhe(null);
    try {
      await asetaHaaste(haaste, adminSalasana);
      setNykyinen(haaste);
    } catch (e) {
      setVirhe(e instanceof Error ? e.message : "Haasteen tallennus epäonnistui");
    } finally {
      setTallennetaan(false);
    }
  }

  function lahetaLomake(e: FormEvent) {
    e.preventDefault();
    void tallenna({ nimi: nimi.trim(), alku: isoksi(alku), loppu: isoksi(loppu), tavoite: Number(tavoite) });
  }

  return (
    <>
      <h2>Yhteishaaste</h2>
      {nykyinen ? (
        <p>
          Aktiivinen: <strong>{nykyinen.nimi}</strong> ({new Date(nykyinen.alku).toLocaleString("fi-FI")} –{" "}
          {new Date(nykyinen.loppu).toLocaleString("fi-FI")}, tavoite {nykyinen.tavoite} kätköä){" "}
          <button type="button" className="nappi nappi-toissijainen" disabled={tallennetaan} onClick={() => void tallenna(null)}>
            Poista haaste
          </button>
        </p>
      ) : (
        <p className="tyhja-tila">Ei aktiivista haastetta.</p>
      )}

      {virhe && (
        <p className="lomake-virhe" role="alert">
          {virhe}
        </p>
      )}

      <form className="loyto-lomake" onSubmit={lahetaLomake}>
        <label className="kentta">
          <span className="kentan-nimi">Nimi</span>
          <input className="teksti-syote" value={nimi} onChange={(e) => setNimi(e.target.value)} maxLength={60} required placeholder="Esim. Viikonloppuhaaste" />
        </label>
        <label className="kentta">
          <span className="kentan-nimi">Alkaa</span>
          <input className="teksti-syote" type="datetime-local" value={alku} onChange={(e) => setAlku(e.target.value)} required />
        </label>
        <label className="kentta">
          <span className="kentan-nimi">Päättyy</span>
          <input className="teksti-syote" type="datetime-local" value={loppu} onChange={(e) => setLoppu(e.target.value)} required />
        </label>
        <label className="kentta">
          <span className="kentan-nimi">Tavoite (kätköä)</span>
          <input className="teksti-syote" type="number" min={1} max={1000} value={tavoite} onChange={(e) => setTavoite(e.target.value)} required />
        </label>
        <button className="nappi nappi-ensisijainen" type="submit" disabled={tallennetaan}>
          {nykyinen ? "Korvaa haaste" : "Aseta haaste"}
        </button>
      </form>
    </>
  );
}
