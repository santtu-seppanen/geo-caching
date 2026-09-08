import type { Paikka } from "./types";

const VARASTOAVAIN = "paikka-halytin:paikat";

function lueVarastoidutPaikat(): Paikka[] {
  const raaka = localStorage.getItem(VARASTOAVAIN);
  if (!raaka) return [];
  try {
    const jasennetty = JSON.parse(raaka);
    return Array.isArray(jasennetty) ? (jasennetty as Paikka[]) : [];
  } catch {
    return [];
  }
}

function kirjoitaVarastoidutPaikat(paikat: Paikka[]): void {
  try {
    localStorage.setItem(VARASTOAVAIN, JSON.stringify(paikat));
  } catch (virhe) {
    throw new Error(
      "Paikan tallennus epäonnistui: selaimen tallennustila on täynnä. Poista vanhoja paikkoja tai kuvia ja yritä uudelleen.",
      { cause: virhe },
    );
  }
}

function luoDataUrl(tiedosto: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lukija = new FileReader();
    lukija.onload = () => resolve(lukija.result as string);
    lukija.onerror = () => reject(new Error("Kuvan lukeminen epäonnistui"));
    lukija.readAsDataURL(tiedosto);
  });
}

export async function haePaikat(): Promise<Paikka[]> {
  const paikat = lueVarastoidutPaikat();
  return [...paikat].sort(
    (a, b) => new Date(b.luotu).getTime() - new Date(a.luotu).getTime(),
  );
}

export async function tallennaPaikka(input: {
  kuvaus: string;
  lat: number;
  lng: number;
  kuva?: File;
}): Promise<Paikka> {
  const kuvaDataUrl = input.kuva ? await luoDataUrl(input.kuva) : null;

  const uusiPaikka: Paikka = {
    id: Date.now(),
    kuvaus: input.kuvaus,
    lat: input.lat,
    lng: input.lng,
    kuva_tiedosto: kuvaDataUrl,
    luotu: new Date().toISOString(),
  };

  const paikat = lueVarastoidutPaikat();
  paikat.push(uusiPaikka);
  kirjoitaVarastoidutPaikat(paikat);

  return uusiPaikka;
}

export async function poistaPaikka(id: number): Promise<void> {
  const paikat = lueVarastoidutPaikat();
  const jaljella = paikat.filter((paikka) => paikka.id !== id);
  kirjoitaVarastoidutPaikat(jaljella);
}
