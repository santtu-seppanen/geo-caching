/** Lukee tiedoston base64-merkkijonoksi ilman "data:...;base64,"-etuliitettä. */
export function lueTiedostoBase64na(tiedosto: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const tulos = reader.result;
      if (typeof tulos !== "string") {
        reject(new Error("Kuvan luku epäonnistui"));
        return;
      }
      const pilkku = tulos.indexOf(",");
      resolve(pilkku === -1 ? tulos : tulos.slice(pilkku + 1));
    };
    reader.onerror = () => reject(new Error("Kuvan luku epäonnistui"));
    reader.readAsDataURL(tiedosto);
  });
}
