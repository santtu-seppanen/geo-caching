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

export async function nayttaIlmoitus(otsikko: string, viesti: string): Promise<void> {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const asetukset: NotificationOptions = {
    body: viesti,
    icon: `${import.meta.env.BASE_URL}pwa-192x192.png`,
  };

  // Android-selaimet (Chrome, Brave, Samsung Internet…) eivät tue suoraa
  // `new Notification()`-konstruktoria vaan vaativat
  // ServiceWorkerRegistration.showNotification()-kutsun — konstruktori
  // heittää TypeErrorin, joka kaataisi koko Reactin ilman virherajaa.
  const rekisterointi = "serviceWorker" in navigator
    ? await navigator.serviceWorker.getRegistration()
    : undefined;

  if (rekisterointi) {
    void rekisterointi.showNotification(otsikko, asetukset);
    return;
  }

  try {
    new Notification(otsikko, asetukset);
  } catch {
    // Ei tuettu ilman service workeria (esim. paikallinen kehitys) — hälytys
    // näkyy silti sivun omassa bannerissa (App.tsx:n viimeisinHalytys).
  }
}
