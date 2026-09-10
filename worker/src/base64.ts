// atob/btoa käsittelevät vain Latin1-merkistöä — suomalaiset nimet (äöå)
// vaativat UTF-8-turvallisen enkoodauksen ennen base64:ää.

export function utf8ToBase64(teksti: string): string {
  const tavut = new TextEncoder().encode(teksti);
  let binaari = "";
  for (const tavu of tavut) binaari += String.fromCharCode(tavu);
  return btoa(binaari);
}

export function base64ToUtf8(base64: string): string {
  const binaari = atob(base64.replace(/\n/g, ""));
  const tavut = new Uint8Array(binaari.length);
  for (let i = 0; i < binaari.length; i++) tavut[i] = binaari.charCodeAt(i);
  return new TextDecoder().decode(tavut);
}
