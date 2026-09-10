export interface Paikka {
  id: string;
  alue: string;
  alueVihje: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
}

export interface Loyto {
  paikkaId: string;
  nimi: string;
  aika: string;
}
