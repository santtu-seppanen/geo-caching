/**
 * Selaimen Notification-rajapinnan kääre. Toimii vain kun sivu on auki
 * (ei push-palvelinta) — ilmoitus näkyy silti käyttöjärjestelmän tasolla,
 * ei vain sivun sisällä, joten se huomataan myös puhelimen ollessa taskussa
 * näyttö pois päältä, kunhan selain on käynnissä taustalla.
 */
export function pyydaIlmoituslupa(): void {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function nayttaIlmoitus(otsikko: string, viesti: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  new Notification(otsikko, {
    body: viesti,
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
  });
}
