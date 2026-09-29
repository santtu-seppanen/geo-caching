interface PullonKokoIkoniProps {
  /** null piirtää himmeän, katkoviivaisen ääriviivan "ei tiedossa" -tilaa varten. */
  ml: number | null;
  className?: string;
}

const MIN_ML = 50;
const MAX_ML = 1000;
const MIN_RUNKO_KORKEUS = 8;
const MAX_RUNKO_KORKEUS = 18;
const KAULA_LEVEYS = 6;
const KAULA_KORKEUS = 6;
const RUNKO_LEVEYS = 14;
const RUNKO_X = 2;
const POHJA_Y = 26;

function runkoKorkeus(ml: number): number {
  const suhde = (Math.min(Math.max(ml, MIN_ML), MAX_ML) - MIN_ML) / (MAX_ML - MIN_ML);
  return MIN_RUNKO_KORKEUS + suhde * (MAX_RUNKO_KORKEUS - MIN_RUNKO_KORKEUS);
}

/**
 * Pullon ääriviiva, jonka runko-osan korkeus kuvaa suhteellista tilavuutta
 * (50 ml – 1000 ml) — käytetään pullon koon valikossa ja kätkön tiedoissa,
 * jotta koot erottaa toisistaan nopealla vilkaisulla eikä vain numerosta.
 */
export function PullonKokoIkoni({ ml, className }: PullonKokoIkoniProps) {
  const runko = ml !== null ? runkoKorkeus(ml) : MIN_RUNKO_KORKEUS;
  const runkoY = POHJA_Y - runko;
  const kaulaX = RUNKO_X + (RUNKO_LEVEYS - KAULA_LEVEYS) / 2;
  const kaulaY = runkoY - KAULA_KORKEUS;

  return (
    <svg
      className={className}
      width="18"
      height="28"
      viewBox="0 0 18 28"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      style={ml === null ? { opacity: 0.45, strokeDasharray: "2 2" } : undefined}
    >
      <rect x={kaulaX} y={kaulaY} width={KAULA_LEVEYS} height={KAULA_KORKEUS} rx="1" />
      <rect x={RUNKO_X} y={runkoY} width={RUNKO_LEVEYS} height={runko} rx="2" />
    </svg>
  );
}
