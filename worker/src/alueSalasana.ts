/**
 * Alueiden omat admin-salasanat. Tallennetaan vain PBKDF2-hashina
 * muodossa `pbkdf2$<iteraatiot>$<suola base64>$<hash base64>`.
 * Iteraatiomäärä on maltillinen, koska Workerin CPU-aika on rajallinen —
 * kyse on pienen porukan pelin alueista, ei arkaluonteisesta datasta.
 */
const ITERAATIOT = 10_000;

function base64(tavut: Uint8Array): string {
  return btoa(String.fromCharCode(...tavut));
}

function base64Tavuiksi(teksti: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(teksti), (merkki) => merkki.charCodeAt(0));
}

async function johda(salasana: string, suola: Uint8Array<ArrayBuffer>, iteraatiot: number): Promise<Uint8Array> {
  const avain = await crypto.subtle.importKey("raw", new TextEncoder().encode(salasana), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bitit = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: suola, iterations: iteraatiot },
    avain,
    256,
  );
  return new Uint8Array(bitit);
}

export async function hashaaSalasana(salasana: string): Promise<string> {
  const suola = crypto.getRandomValues(new Uint8Array(16));
  const hash = await johda(salasana, suola, ITERAATIOT);
  return `pbkdf2$${ITERAATIOT}$${base64(suola)}$${base64(hash)}`;
}

export async function tarkistaSalasana(salasana: string, tallennettu: string): Promise<boolean> {
  const [tyyppi, iteraatiot, suola, odotettu] = tallennettu.split("$");
  if (tyyppi !== "pbkdf2" || !iteraatiot || !suola || !odotettu) return false;

  const hash = await johda(salasana, base64Tavuiksi(suola), Number(iteraatiot));
  const odotetutTavut = base64Tavuiksi(odotettu);
  if (hash.length !== odotetutTavut.length) return false;
  // Vakioaikainen vertailu.
  let ero = 0;
  for (let i = 0; i < hash.length; i++) ero |= hash[i] ^ odotetutTavut[i];
  return ero === 0;
}

/** Sama kuin frontendin normalisoiAlueNimi (app/src/features/paikat/alueet.ts) — `alueet`-taulun avain. */
export function normalisoiAlueNimi(teksti: string): string {
  return teksti.trim().toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a");
}

/** Sama kuin frontendin alueTunnisteeksi (app/src/features/admin/validointi.ts) — kätköjen id-etuliite. */
export function alueTunnisteeksi(alue: string): string {
  return normalisoiAlueNimi(alue)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Sama kuin frontendin paikanTunniste (app/src/features/paikat/alueet.ts). */
export function paikanTunniste(id: string): string {
  const numerollinen = /^(.+)-\d+$/.exec(id);
  return numerollinen ? numerollinen[1] : id;
}
