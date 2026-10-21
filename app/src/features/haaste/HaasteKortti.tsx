import type { Loyto } from "../paikat/types";
import { Edistymispalkki } from "../paikat/Edistymispalkki";
import { muotoileKesto } from "../../lib/kesto";
import { haasteenEteneminen, type Haaste } from "./haaste";

interface HaasteKorttiProps {
  haaste: Haaste;
  loydot: Loyto[];
}

const muotoilePvm = (iso: string) =>
  new Date(iso).toLocaleString("fi-FI", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

/** Etusivun yhteishaasteen edistymiskortti — sama sarjakuvamainen kehys kuin löytöanimaatiossa. */
export function HaasteKortti({ haaste, loydot }: HaasteKorttiProps) {
  const e = haasteenEteneminen(haaste, loydot, Date.now());

  // Päättynyt epäonnistunut haaste ei kuulu etusivulle jäämään roikkumaan.
  if (e.tila === "paattynyt" && !e.onnistui) return null;

  return (
    <section className="haaste-kortti" aria-label="Yhteishaaste">
      <h2 className="haaste-otsikko">{e.onnistui ? "🏆 " : ""}{haaste.nimi}</h2>
      {e.tila === "tulossa" ? (
        <p>Alkaa {muotoilePvm(haaste.alku)} — tavoite {haaste.tavoite} kätköä yhdessä.</p>
      ) : (
        <>
          <Edistymispalkki loydetty={Math.min(e.loydetty, e.tavoite)} yhteensa={e.tavoite} teksti="kätköä löydetty yhdessä" />
          <p>
            {e.tila === "kaynnissa"
              ? e.onnistui
                ? "Tavoite saavutettu — hyvä ryhmä!"
                : `Aikaa jäljellä ${muotoileKesto(e.aikaaMs).replace(/^(\d+):(\d+):\d+$/, "$1 h $2 min")}`
              : "Haaste suoritettu!"}
          </p>
        </>
      )}
    </section>
  );
}
