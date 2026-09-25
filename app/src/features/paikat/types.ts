export interface Paikka {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
  /** Jätetään pois etusivun "lähin alue" -huomautuksesta (ks. laheisinAlue.ts), ettei se paljasta yllätyskätköä etukäteen. */
  piilotaLahimmasta?: boolean;
}

export interface Loyto {
  paikkaId: string;
  nimi: string;
  aika: string;
}
