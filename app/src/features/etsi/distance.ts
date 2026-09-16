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

/** Alkusuuntima asteina (0-360, 0 = pohjoinen, myötäpäivään) pisteestä a pisteeseen b. */
export function suuntimaAsteina(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const deltaLambda = toRad(b.lng - a.lng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const asteet = toDeg(Math.atan2(y, x));
  return (asteet + 360) % 360;
}
