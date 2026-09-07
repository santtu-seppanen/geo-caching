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
