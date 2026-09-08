export interface Paikka {
  id: number;
  kuvaus: string;
  lat: number;
  lng: number;
  /** Selainversiossa (localStorage) tämä sisältää kuvan data-URL:n, ei tiedostonimeä. */
  kuva_tiedosto: string | null;
  luotu: string;
}
