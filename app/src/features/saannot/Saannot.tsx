interface SaannotProps {
  onTakaisin: () => void;
}

export function Saannot({ onTakaisin }: SaannotProps) {
  return (
    <section className="saannot">
      <button type="button" className="nappi nappi-toissijainen" onClick={onTakaisin}>
        ← Takaisin
      </button>

      <h2>Viinakätköilyn säännöt</h2>

      <ol className="saannot-lista">
        <li>
          <strong>Etsi viina.</strong> Käytä koordinaatteja ja vihjeitä viinan
          paikantamiseen.
        </li>
        <li>
          <strong>Kirjaa löytö sovellukseen.</strong> Kun löydät viinan,
          merkitse löytö nimimerkilläsi sovelluksessa.
        </li>
        <li>
          <strong>Jätä tilalle uutta viinaa.</strong> Jos otat viinan
          kätköstä, jätä tilalle uusi viina, jotta kätkö pysyy
          elossa seuraavalle löytäjälle.
        </li>
        <li>
          <strong>Palauta kätkö.</strong> Laita viina täsmälleen samaan
          paikkaan ja asentoon, mistä sen löysit.
        </li>
        <li>
          <strong>Toimi huomaamattomasti.</strong> Älä paljasta viinan
          paikkaa ulkopuolisille jästeille.
        </li>
        <li>
          <strong>Kunnioita ympäristöä.</strong> Älä tuhoa luontoa tai ilmoita
          viinoista yksityisalueilla ilman lupaa. Noudata "ei jätetä jälkiä"
          -periaatetta.
        </li>
      </ol>
    </section>
  );
}
