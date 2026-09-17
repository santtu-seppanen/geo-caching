import { useState } from "react";
import etsiViinaKuva from "../../assets/saannot/etsi-viina.webp";
import kirjaaLoytoKuva from "../../assets/saannot/kirjaa-loyto.webp";
import jataViinaaKuva from "../../assets/saannot/jata-viinaa.webp";
import palautaKatkoKuva from "../../assets/saannot/palauta-katko.webp";
import toimiHuomaamattomastiKuva from "../../assets/saannot/toimi-huomaamattomasti.webp";
import kunnioitaYmparistoaKuva from "../../assets/saannot/kunnioita-ymparistoa.webp";

interface SaantoAskel {
  otsikko: string;
  lyhenne: string;
  kuva: string;
  repliikki: string;
}

const ASKELEET: SaantoAskel[] = [
  {
    otsikko: "Etsi viina",
    lyhenne: "Etsi",
    kuva: etsiViinaKuva,
    repliikki: "GPS näyttää viittä metriä… Täällä sen täytyy olla!",
  },
  {
    otsikko: "Kirjaa löytö sovellukseen",
    lyhenne: "Kirjaa",
    kuva: kirjaaLoytoKuva,
    repliikki: "Ja näin: LÖYDETTY! Nimimerkki: KätköKettu99.",
  },
  {
    otsikko: "Jätä tilalle uutta viinaa",
    lyhenne: "Jätä",
    kuva: jataViinaaKuva,
    repliikki: "Yksi pois, yksi tilalle – traditio jatkuu!",
  },
  {
    otsikko: "Palauta kätkö",
    lyhenne: "Palauta",
    kuva: palautaKatkoKuva,
    repliikki: "Sama paikka, sama asento. Täydellistä.",
  },
  {
    otsikko: "Toimi huomaamattomasti",
    lyhenne: "Toimi",
    kuva: toimiHuomaamattomastiKuva,
    repliikki: "Olen vain viaton lenkkeilijä, ei mitään nähtävää…",
  },
  {
    otsikko: "Kunnioita ympäristöä",
    lyhenne: "Kunnioita",
    kuva: kunnioitaYmparistoaKuva,
    repliikki: "Luonto kiittää, kun kätköilijä kulkee jälkiä jättämättä!",
  },
];

interface SaannotProps {
  onSulje: () => void;
}

export function Saannot({ onSulje }: SaannotProps) {
  const [askel, setAskel] = useState(0);
  const nykyinen = ASKELEET[askel];
  const viimeinen = askel === ASKELEET.length - 1;

  return (
    <section className="saannot">
      <button type="button" className="nappi nappi-toissijainen sulje-nappi" onClick={onSulje}>
        Sulje
      </button>

      <h2>Viinakätköilyn säännöt</h2>

      <ol className="saannot-polku">
        {ASKELEET.map((a, i) => (
          <li key={a.otsikko}>
            <button
              type="button"
              className={
                "saannot-piste" +
                (i === askel ? " aktiivinen" : i < askel ? " kayty" : "")
              }
              onClick={() => setAskel(i)}
              aria-label={`Sääntö ${i + 1}: ${a.otsikko}`}
              aria-current={i === askel ? "step" : undefined}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <p className="saannot-vaihe">
        Sääntö {askel + 1}/{ASKELEET.length}
      </p>

      <figure className="saannot-kuva-kehys">
        <img src={nykyinen.kuva} alt={`Sarjakuvaruutu säännöstä “${nykyinen.otsikko}”`} />
      </figure>

      <h3 className="saannot-otsikko">{nykyinen.otsikko}</h3>
      <blockquote className="saannot-repliikki">“{nykyinen.repliikki}”</blockquote>

      <div className="saannot-ohjaimet">
        <button
          type="button"
          className="nappi nappi-toissijainen"
          onClick={() => setAskel((a) => Math.max(0, a - 1))}
          disabled={askel === 0}
        >
          <span className="nappi-nuoli nappi-nuoli-vasen" aria-hidden="true" />
          Edellinen
        </button>
        <button
          type="button"
          className="nappi nappi-ensisijainen"
          onClick={() => setAskel((a) => (a === ASKELEET.length - 1 ? 0 : a + 1))}
        >
          {viimeinen ? (
            "Alusta ↺"
          ) : (
            <>
              Seuraava
              <span className="nappi-nuoli nappi-nuoli-oikea" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
