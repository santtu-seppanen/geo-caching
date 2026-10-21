const AVAIN = "viinakatkoily.aanet";

/** Äänitehosteet ovat oletuksena pois päältä — kätköilijä voi olla "viattomana lenkkeilijänä" (ks. säännöt). */
export function aanetPaalla(): boolean {
  try {
    return window.localStorage.getItem(AVAIN) === "1";
  } catch {
    return false;
  }
}

export function asetaAanet(paalla: boolean): void {
  try {
    window.localStorage.setItem(AVAIN, paalla ? "1" : "0");
  } catch {
    // Hiljainen epäonnistuminen — asetusta ei silloin muisteta.
  }
}

/** Lyhyt nouseva fanfaari WebAudiolla (ei äänitiedostoja). Ei tee mitään jos äänet ovat pois tai API puuttuu. */
export function soitaLoytoAani(): void {
  if (!aanetPaalla()) return;
  const Konteksti = window.AudioContext;
  if (!Konteksti) return;
  try {
    const ctx = new Konteksti();
    const nuotit = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    nuotit.forEach((taajuus, i) => {
      const osc = ctx.createOscillator();
      const vahvistin = ctx.createGain();
      const alku = ctx.currentTime + i * 0.12;
      osc.type = "square";
      osc.frequency.value = taajuus;
      vahvistin.gain.setValueAtTime(0.08, alku);
      vahvistin.gain.exponentialRampToValueAtTime(0.001, alku + 0.2);
      osc.connect(vahvistin).connect(ctx.destination);
      osc.start(alku);
      osc.stop(alku + 0.22);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Selain esti äänen (esim. ei käyttäjän eleen jälkeen) — ei haittaa.
  }
}
