const SUUNNAT = [
  "pohjoiseen",
  "koilliseen",
  "itään",
  "kaakkoon",
  "etelään",
  "lounaaseen",
  "länteen",
  "luoteeseen",
] as const;

/** Muuntaa suuntima-asteet (0-360) lähimmäksi ilmansuunnaksi suomeksi (8 pääilmansuuntaa). */
export function ilmansuuntaTekstiksi(asteet: number): string {
  const normalisoitu = ((asteet % 360) + 360) % 360;
  const indeksi = Math.round(normalisoitu / 45) % 8;
  return SUUNNAT[indeksi];
}
