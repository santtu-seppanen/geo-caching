import type { Paikka } from "../paikat/types";
import type { Pelitila } from "./pelitila";
import { PELIMOODIN_KUVAUS, PELIMOODIN_NIMI, type Pelimoodi } from "./pelimoodit";
import {
  avautuneitaVihjeita,
  MITTAUS_VALI_MS,
  seuraavaanVihjeeseenMs,
  VIHJE_TASOT,
} from "./vihjeet";

interface PelimoodiPaneeliProps {
  moodi: Pelimoodi;
  paikat: Paikka[];
  kohde: Paikka | null;
  tila: Pelitila;
  nyt: number;
  sijaintiTiedossa: boolean;
  onMittaa: () => void;
}

function kesto(ms: number): string {
  const sekunnit = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sekunnit / 60)}:${String(sekunnit % 60).padStart(2, "0")}`;
}

export function PelimoodiPaneeli({
  moodi,
  paikat,
  kohde,
  tila,
  nyt,
  sijaintiTiedossa,
  onMittaa,
}: PelimoodiPaneeliProps) {
  if (moodi === "vapaa") return null;

  const viimeisinMittaus = tila.mittaukset.at(-1) ?? null;
  const mittausOdotusMs = viimeisinMittaus ? viimeisinMittaus.aika + MITTAUS_VALI_MS - nyt : 0;

  return (
    <div className="pelimoodi-paneeli">
      <p className="pelimoodi-otsikko">
        <span className="pelimoodi-nimi">{PELIMOODIN_NIMI[moodi]}</span>
        {kohde && (
          <span className="pelimoodi-kohde">
            Kätkö {paikat.indexOf(kohde) + 1} / {paikat.length}
          </span>
        )}
      </p>
      <p className="pelimoodi-kuvaus">{PELIMOODIN_KUVAUS[moodi]}</p>

      {!kohde ? (
        <p className="pelimoodi-tila">Olet löytänyt kaikki alueen kätköt!</p>
      ) : moodi === "kolmiomittaus" ? (
        <>
          {viimeisinMittaus && (
            <p className="pelimoodi-tila">
              Viimeisin mittaus: kätkö on noin {viimeisinMittaus.etaisyysMetreina} m päässä
              mittauspisteestä.
            </p>
          )}
          <button
            type="button"
            className="nappi nappi-ensisijainen"
            onClick={onMittaa}
            disabled={!sijaintiTiedossa || mittausOdotusMs > 0}
          >
            {mittausOdotusMs > 0
              ? `Seuraava mittaus ${kesto(mittausOdotusMs)} päästä`
              : sijaintiTiedossa
                ? "Mittaa etäisyys tästä"
                : "Odotetaan sijaintia…"}
          </button>
        </>
      ) : moodi === "vihjeet" ? (
        tila.alkoi === null ? (
          <p className="pelimoodi-tila">
            Ensimmäinen vihje avautuu, kun olet tarpeeksi lähellä kätköä.
          </p>
        ) : (
          <p className="pelimoodi-tila">
            Vihjeitä {avautuneitaVihjeita(tila.alkoi, nyt)} / {VIHJE_TASOT.length} — kätkö on
            pienimmän ympyrän sisällä.
            {(() => {
              const odotus = seuraavaanVihjeeseenMs(tila.alkoi, nyt);
              return odotus === null ? null : ` Seuraava vihje ${kesto(odotus)} päästä.`;
            })()}
          </p>
        )
      ) : null}
    </div>
  );
}
