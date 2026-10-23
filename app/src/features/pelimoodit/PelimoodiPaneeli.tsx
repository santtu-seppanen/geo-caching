import { useEffect, useRef, useState } from "react";
import type { Paikka } from "../paikat/types";
import type { Pelitila } from "./pelitila";
import { ETSINTA_MAX_MS, type Eteneminen } from "./etsinta";
import { AJASTETTU_HAKU_MS, PELIMOODIN_KUVAUS, PELIMOODIN_NIMI, type Pelimoodi } from "./pelimoodit";
import {
  avautuneitaVihjeita,
  MITTAUS_VALI_MS,
  seuraavaanVihjeeseenMs,
  VIHJE_TASOT,
} from "./vihjeet";
import { muotoileKesto } from "../../lib/kesto";
import { pelitapahtuma, type TapahtumaTila } from "./tapahtumat";
import { haePelaajanNimi } from "../../lib/pelaajanNimi";
import { NimimerkkiKentta } from "../paikat/NimimerkkiKentta";

/** Kuinka kauan tapahtumakupla näkyy. */
const KUPLA_NAKYVISSA_MS = 4000;

interface PelimoodiPaneeliProps {
  moodi: Pelimoodi;
  paikat: Paikka[];
  eteneminen: Eteneminen;
  etsintaAlkoi: number | null;
  /** Aloitettu eikä 3 tunnin takaraja ole täynnä (ks. etsintaKaynnissa). */
  kaynnissa: boolean;
  /** Edellinen oma löytö tai etsinnän aloitus (ks. loytoajastimenAlku). */
  loytoajastinAlkoi: number | null;
  kaikkiLoydetty: boolean;
  tila: Pelitila;
  nyt: number;
  sijaintiTiedossa: boolean;
  onMittaa: () => void;
  onAloita: () => void;
}

export function PelimoodiPaneeli({
  moodi,
  paikat,
  eteneminen,
  etsintaAlkoi,
  kaynnissa,
  loytoajastinAlkoi,
  kaikkiLoydetty,
  tila,
  nyt,
  sijaintiTiedossa,
  onMittaa,
  onAloita,
}: PelimoodiPaneeliProps) {
  const [vahvistaAlusta, setVahvistaAlusta] = useState(false);
  const [nimimerkkiTiedossa, setNimimerkkiTiedossa] = useState(() => haePelaajanNimi().trim() !== "");
  const { kohde, vuoroAlkoi, ohitetutIdt } = eteneminen;
  const aloitettu = etsintaAlkoi !== null;
  const paattyi = aloitettu && !kaynnissa;

  // Sarjakuvakupla vihjeen avautuessa / kätkön ohituksessa — vertaa edelliseen renderiin.
  const [kupla, setKupla] = useState<string | null>(null);
  const edellinenTila = useRef<TapahtumaTila | null>(null);
  const nykyinenTila: TapahtumaTila = {
    moodi,
    vuoroAlkoi,
    avautuneitaVihjeita: vuoroAlkoi === null ? 0 : avautuneitaVihjeita(vuoroAlkoi, nyt),
    ohitettuja: ohitetutIdt.size,
  };
  const viesti = pelitapahtuma(edellinenTila.current, nykyinenTila);
  useEffect(() => {
    edellinenTila.current = nykyinenTila;
    if (!viesti) return;
    setKupla(viesti);
    const ajastin = setTimeout(() => setKupla(null), KUPLA_NAKYVISSA_MS);
    return () => clearTimeout(ajastin);
  }, [nykyinenTila.moodi, nykyinenTila.vuoroAlkoi, nykyinenTila.avautuneitaVihjeita, nykyinenTila.ohitettuja]);

  const viimeisinMittaus = tila.mittaukset.at(-1) ?? null;
  const mittausOdotusMs = viimeisinMittaus ? viimeisinMittaus.aika + MITTAUS_VALI_MS - nyt : 0;

  function moodinTila() {
    if (kaikkiLoydetty) {
      return <p className="pelimoodi-tila">Olet löytänyt kaikki alueen kätköt!</p>;
    }
    if (paattyi) {
      return (
        <p className="pelimoodi-tila">
          Etsintä päättyi — {muotoileKesto(ETSINTA_MAX_MS)} takaraja täyttyi. Aloita uusi etsintä
          jatkaaksesi.
        </p>
      );
    }
    if (moodi === "ajastettu" && !aloitettu) {
      return <p className="pelimoodi-tila">Ensimmäinen kätkö näkyy, kun aloitat etsinnän.</p>;
    }
    if (moodi !== "vapaa" && !kohde) {
      return (
        <p className="pelimoodi-tila">
          Haku päättyi — aika loppui {ohitetutIdt.size} kätkön kohdalla. Aloita alusta yrittääksesi
          uudelleen.
        </p>
      );
    }

    if (moodi === "ajastettu" && vuoroAlkoi !== null) {
      return (
        <p className="pelimoodi-tila">
          Aikaa jäljellä {muotoileKesto(vuoroAlkoi + AJASTETTU_HAKU_MS - nyt)}.
          {ohitetutIdt.size > 0 && ` Ohitettu ${ohitetutIdt.size}.`}
        </p>
      );
    }

    if (moodi === "vihjeet") {
      if (vuoroAlkoi === null) {
        return <p className="pelimoodi-tila">Vihjeet alkavat avautua, kun aloitat etsinnän.</p>;
      }
      const odotus = seuraavaanVihjeeseenMs(vuoroAlkoi, nyt);
      return (
        <p className="pelimoodi-tila">
          Vihjeitä {avautuneitaVihjeita(vuoroAlkoi, nyt)} / {VIHJE_TASOT.length} — kätkö on
          pienimmän ympyrän sisällä.
          {odotus !== null && ` Seuraava vihje ${muotoileKesto(odotus)} päästä.`}
        </p>
      );
    }

    if (moodi === "kolmiomittaus") {
      return (
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
              ? `Seuraava mittaus ${muotoileKesto(mittausOdotusMs)} päästä`
              : sijaintiTiedossa
                ? "Mittaa etäisyys tästä"
                : "Odotetaan sijaintia…"}
          </button>
        </>
      );
    }

    return null;
  }

  return (
    <div className="pelimoodi-paneeli">
      {kupla && (
        <p className="tapahtuma-kupla" role="status">
          {kupla}
        </p>
      )}
      <p className="pelimoodi-otsikko">
        <span className="pelimoodi-nimi">{PELIMOODIN_NIMI[moodi]}</span>
        {kohde && (
          <span className="pelimoodi-kohde">
            Kätkö {paikat.indexOf(kohde) + 1} / {paikat.length}
          </span>
        )}
      </p>
      <p className="pelimoodi-kuvaus">{PELIMOODIN_KUVAUS[moodi]}</p>

      {moodinTila()}

      {kaynnissa && loytoajastinAlkoi !== null && !kaikkiLoydetty && (
        <p className="pelimoodi-tila">
          Löytöajastin {muotoileKesto(nyt - loytoajastinAlkoi)} · etsintää jäljellä{" "}
          {muotoileKesto(etsintaAlkoi! + ETSINTA_MAX_MS - nyt)}
        </p>
      )}

      {!kaynnissa ? (
        <>
          {!nimimerkkiTiedossa && (
            <>
              <p className="pelimoodi-tila">Aseta nimimerkki ennen kuin aloitat etsinnän.</p>
              <NimimerkkiKentta onTallennettu={() => setNimimerkkiTiedossa(true)} />
            </>
          )}
          <button
            type="button"
            className="nappi nappi-ensisijainen"
            disabled={!nimimerkkiTiedossa}
            onClick={onAloita}
          >
            {paattyi ? "Aloita uusi etsintä" : "Aloita etsintä"}
          </button>
        </>
      ) : vahvistaAlusta ? (
        <div className="pelimoodi-vahvistus">
          <p className="pelimoodi-tila">
            Aloitetaanko alusta? Ajastimet nollautuvat ja vihjeet/kätköt käydään läpi alusta.
          </p>
          <button
            type="button"
            className="nappi nappi-ensisijainen"
            onClick={() => {
              setVahvistaAlusta(false);
              onAloita();
            }}
          >
            Aloita alusta
          </button>
          <button type="button" className="nappi nappi-toissijainen" onClick={() => setVahvistaAlusta(false)}>
            Peru
          </button>
        </div>
      ) : (
        <button type="button" className="nappi nappi-toissijainen" onClick={() => setVahvistaAlusta(true)}>
          Aloita etsintä alusta
        </button>
      )}
    </div>
  );
}
