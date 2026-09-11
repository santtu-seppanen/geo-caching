import { useState } from "react";
import type { FormEvent } from "react";
import type { Paikka, Loyto } from "./types";
import { ilmoitaLoyto } from "./loydotApi";
import loydotData from "../../data/loydot.json";

const loydot = loydotData as Loyto[];

interface KatkoPaneeliProps {
  paikka: Paikka;
  omatLoydot: Loyto[];
  onLoyto: (loyto: Loyto) => void;
  onSulje: () => void;
}

export function KatkoPaneeli({ paikka, omatLoydot, onLoyto, onSulje }: KatkoPaneeliProps) {
  const [nimi, setNimi] = useState("");
  const [lahetetaan, setLahetetaan] = useState(false);
  const [virhe, setVirhe] = useState<string | null>(null);

  const naytettavatLoydot = [
    ...loydot.filter((loyto) => loyto.paikkaId === paikka.id),
    ...omatLoydot.filter((loyto) => loyto.paikkaId === paikka.id),
  ];

  async function lahetaLoyto(e: FormEvent) {
    e.preventDefault();
    const siistittyNimi = nimi.trim();
    if (!siistittyNimi) return;

    setLahetetaan(true);
    setVirhe(null);
    try {
      await ilmoitaLoyto(paikka.id, siistittyNimi);
      onLoyto({ paikkaId: paikka.id, nimi: siistittyNimi, aika: new Date().toISOString() });
      setNimi("");
    } catch (virhe) {
      setVirhe(virhe instanceof Error ? virhe.message : "Löydön tallennus epäonnistui");
    } finally {
      setLahetetaan(false);
    }
  }

  return (
    <div className="katko-paneeli">
      <button type="button" className="nappi nappi-toissijainen sulje-nappi" onClick={onSulje}>
        Sulje
      </button>

      <img
        className="katko-kuva"
        src={`${import.meta.env.BASE_URL}kuvat/${paikka.kuva}`}
        alt={paikka.kuvaus}
      />
      <p className="katko-kuvaus">{paikka.kuvaus}</p>

      <div className="loytajat">
        <h3>Löytäjät</h3>
        {naytettavatLoydot.length === 0 ? (
          <p className="tyhja-tila">Ei vielä löytäjiä — ole ensimmäinen!</p>
        ) : (
          <ul className="loytaja-lista">
            {naytettavatLoydot.map((loyto, indeksi) => (
              <li key={`${loyto.nimi}-${loyto.aika}-${indeksi}`}>
                {loyto.nimi} — {new Date(loyto.aika).toLocaleDateString("fi-FI")}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="loyto-lomake" onSubmit={lahetaLoyto}>
        <label className="kentta">
          <span className="kentan-nimi">Nimesi</span>
          <input
            className="teksti-syote"
            value={nimi}
            onChange={(e) => setNimi(e.target.value)}
            placeholder="Esim. Matti M."
          />
        </label>
        {virhe && (
          <p className="lomake-virhe" role="alert">
            {virhe}
          </p>
        )}
        <button
          className="nappi nappi-ensisijainen"
          type="submit"
          disabled={!nimi.trim() || lahetetaan}
        >
          {lahetetaan ? "Lähetetään…" : "Merkitse löydetyksi"}
        </button>
      </form>
    </div>
  );
}
