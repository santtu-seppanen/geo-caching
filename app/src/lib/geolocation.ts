export interface Sijainti {
  lat: number;
  lng: number;
  tarkkuusMetreina: number;
  aikaleima: number;
}

export type SijaintiVirhe = {
  koodi: "EI_TUETTU" | "LUPA_EVATTY" | "AIKAKATKAISU" | "MUU";
  viesti: string;
};

/**
 * Selaimen watchPosition-rajapinnan kääre. Toimii vain kun sivu on auki ja
 * näkyvissä (ks. docs/architecture.md) — taustapaikannus on
 * geofencing-agentin vastuulla vaiheessa 2.
 */
export function seuraaSijaintia(
  onSijainti: (sijainti: Sijainti) => void,
  onVirhe: (virhe: SijaintiVirhe) => void,
): () => void {
  if (!("geolocation" in navigator)) {
    onVirhe({ koodi: "EI_TUETTU", viesti: "Selain ei tue sijaintirajapintaa" });
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onSijainti({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        tarkkuusMetreina: position.coords.accuracy,
        aikaleima: position.timestamp,
      });
    },
    (error) => {
      const koodi =
        error.code === error.PERMISSION_DENIED
          ? "LUPA_EVATTY"
          : error.code === error.TIMEOUT
            ? "AIKAKATKAISU"
            : "MUU";
      onVirhe({ koodi, viesti: error.message });
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Kertahaku selaimen getCurrentPosition-rajapinnalla (ei jatkuvaa watchia).
 * Käytetään esim. admin-lomakkeen "Käytä nykyistä sijaintia" -napissa, jossa
 * riittää yksi tuore sijaintilukema eikä tarvita seurantaa ajan yli.
 */
export function haeNykyinenSijaintiKerran(): Promise<Sijainti> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ koodi: "EI_TUETTU", viesti: "Selain ei tue sijaintirajapintaa" } satisfies SijaintiVirhe);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          tarkkuusMetreina: position.coords.accuracy,
          aikaleima: position.timestamp,
        });
      },
      (error) => {
        const koodi =
          error.code === error.PERMISSION_DENIED
            ? "LUPA_EVATTY"
            : error.code === error.TIMEOUT
              ? "AIKAKATKAISU"
              : "MUU";
        reject({ koodi, viesti: error.message } satisfies SijaintiVirhe);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  });
}

export function virheTeksti(virhe: SijaintiVirhe): string {
  switch (virhe.koodi) {
    case "EI_TUETTU":
      return "Selaimesi ei tue sijainninhakua.";
    case "LUPA_EVATTY":
      return "Sijaintilupa on evätty. Salli sijainti selaimen asetuksista nähdäksesi lähellä olevat alueet.";
    case "AIKAKATKAISU":
      return "Sijainnin haku aikakatkaistiin. Tarkista verkkoyhteys ja yritä uudelleen.";
    case "MUU":
      return "Sijaintia ei saatu juuri nyt.";
  }
}
