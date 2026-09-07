export interface Paikka {
  id: number;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva_tiedosto: string | null;
  luotu: string;
}
