const MAAPALLON_SADE_METREINA = 6371000;

/** Haversine-etäisyys metreinä kahden koordinaatin välillä. */
export function etaisyysMetreina(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * MAAPALLON_SADE_METREINA * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Muuntaa etäisyyden edistymisprosentiksi väliltä [0, 1]: 1 kynnyksen
 * sisällä (tai lähempänä), 0 kantaman päässä tai kauempana, siltä väliltä
 * lineaarisesti.
 */
export function etenemisprosentti(
  etaisyysMetreina: number,
  kynnysMetreina: number,
  kantamaMetreina: number,
): number {
  if (etaisyysMetreina <= kynnysMetreina) return 1;
  if (etaisyysMetreina >= kantamaMetreina) return 0;
  return (kantamaMetreina - etaisyysMetreina) / (kantamaMetreina - kynnysMetreina);
}
