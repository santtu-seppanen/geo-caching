export interface Paikka {
  id: string;
  alue: string;
  kuvaus: string;
  lat: number;
  lng: number;
  kuva: string;
  /** Jätetään pois etusivun "lähin alue" -huomautuksesta (ks. laheisinAlue.ts), ettei se paljasta yllätyskätköä etukäteen. */
  piilotaLahimmasta?: boolean;
  /** Pullon koko millilitroina — valinnainen tieto, admin voi täyttää myöhemmin. */
  pullonKokoMl?: number | null;
}

export interface Loyto {
  paikkaId: string;
  nimi: string;
  aika: string;
}
