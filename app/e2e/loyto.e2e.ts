import { test, expect, type Page } from "@playwright/test";

const API = "http://api.test";
const KATKO = { lat: 60.17, lng: 24.94 };

const paikat = [
  { id: "neittava-1", alue: "Neittävä", kuvaus: "Kiven alla", ...KATKO, kuva: "k.webp", piilotaLahimmasta: false, pullonKokoMl: null },
];

interface Mock {
  /** Palvelimen GET /etsinnat -vastaus; testi voi muuttaa. */
  etsinnat: unknown[];
  postit: { body: Record<string, unknown>; salasana: string | undefined }[];
}

/** Mockaa Workerin API:n; palauttaa tallennetut POST /loyda -pyynnöt. */
async function mockaaApi(page: Page, loydaVastaus: { status: number; body: unknown } = { status: 201, body: { ok: true } }): Promise<Mock> {
  const mock: Mock = { etsinnat: [], postit: [] };
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" },
    body: JSON.stringify(body),
  });

  await page.route(`${API}/**`, async (route) => {
    const pyynto = route.request();
    const polku = new URL(pyynto.url()).pathname;
    if (pyynto.method() === "OPTIONS") return route.fulfill(json({}, 204));
    if (polku === "/paikat") return route.fulfill(json(paikat));
    if (polku === "/loydot") return route.fulfill(json([]));
    if (polku === "/alueet") return route.fulfill(json([]));
    if (polku === "/etsinnat") return route.fulfill(json(mock.etsinnat));
    if (polku === "/haaste") return route.fulfill(json(null));
    if (polku.startsWith("/kuvat/")) return route.fulfill({ status: 200, contentType: "image/gif", body: Buffer.from("R0lGODlhAQABAAAAACw=", "base64") });
    if (polku === "/loyda" && pyynto.method() === "POST") {
      mock.postit.push({ body: pyynto.postDataJSON(), salasana: pyynto.headers()["x-jaettu-salasana"] });
      return route.fulfill(json(loydaVastaus.body, loydaVastaus.status));
    }
    return route.fulfill(json({ error: "ei mockattu" }, 404));
  });
  // OSM-laatat: ei verkkoa testeissä.
  await page.route("**/tile.openstreetmap.org/**", (route) => route.abort());
  return mock;
}

async function avaaAlueKatkonLahella(page: Page) {
  await page.context().setGeolocation({ latitude: KATKO.lat, longitude: KATKO.lng, accuracy: 10 });
  await page.goto("./");
  await page.getByLabel("Alueen nimi").fill("Neittävä");
  await page.locator("form").getByRole("button", { name: "Näytä kartalla" }).click();
  await expect(page.getByRole("heading", { name: "Neittävä" })).toBeVisible();
}

/**
 * Kätkön merkki ja oman sijainnin merkki ovat samassa pisteessä, joten
 * hiiriklikki osuisi päällimmäiseen — lähetetään klikki suoraan kätkön merkille.
 */
async function avaaKatko(page: Page) {
  const merkki = page.getByRole("button", { name: "Marker" });
  const laatikko = (await merkki.boundingBox())!;
  // Leaflet laskee klikin paikan koordinaateista, joten annetaan ne.
  await merkki.dispatchEvent("click", {
    clientX: laatikko.x + laatikko.width / 2,
    clientY: laatikko.y + laatikko.height / 2,
  });
  await expect(page.locator(".katko-paneeli")).toBeVisible();
}

test("hakee alueen, kirjaa löydön kommentilla ja näyttää löytöanimaation", async ({ page }) => {
  const mock = await mockaaApi(page);
  await avaaAlueKatkonLahella(page);

  await avaaKatko(page);
  await expect(page.locator(".katko-paneeli").getByText("Kiven alla")).toBeVisible();

  await page.getByLabel("Nimesi").fill("Testaaja");
  await page.getByLabel(/Kommentti/).fill("Puun takana");
  await page.getByRole("button", { name: "Merkitse löydetyksi" }).click();

  await expect(page.getByText("KÄTKÖ LÖYDETTY!").or(page.getByText("ENSIMMÄINEN LÖYTÄJÄ!"))).toBeVisible();
  await expect(page.getByText(/Nimimerkki: Testaaja/)).toBeVisible({ timeout: 6000 });

  expect(mock.postit).toHaveLength(1);
  expect(mock.postit[0].salasana).toBe("testi");
  expect(mock.postit[0].body).toMatchObject({ paikkaId: "neittava-1", nimi: "Testaaja", kommentti: "Puun takana", lat: KATKO.lat, lng: KATKO.lng });
});

test("worker hylkää löydön: virhe näkyy eikä animaatiota näytetä", async ({ page }) => {
  await mockaaApi(page, { status: 403, body: { error: "Olet liian kaukana kätköstä" } });
  await avaaAlueKatkonLahella(page);

  await avaaKatko(page);
  await page.getByLabel("Nimesi").fill("Testaaja");
  await page.getByRole("button", { name: "Merkitse löydetyksi" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "liian kaukana" })).toBeVisible();
  await expect(page.getByText("KÄTKÖ LÖYDETTY!")).toHaveCount(0);
});

test("ilman verkkoa löytö jonotetaan ja lähtee kun yhteys palaa", async ({ page, context }) => {
  const mock = await mockaaApi(page);
  await avaaAlueKatkonLahella(page);
  await avaaKatko(page);
  await page.getByLabel("Nimesi").fill("Offline-Olli");

  // Katkaistaan vain POST /loyda — muu data on jo ladattu.
  await page.route(`${API}/loyda`, (route) => route.abort("internetdisconnected"));
  await page.getByRole("button", { name: "Merkitse löydetyksi" }).click();
  await expect(page.getByText(/Nimimerkki: Offline-Olli/)).toBeVisible({ timeout: 6000 });
  const jono = await page.evaluate(() => JSON.parse(localStorage.getItem("viinakatkoily.loytojono") ?? "[]"));
  expect(jono).toHaveLength(1);
  expect(mock.postit).toHaveLength(0);

  // Yhteys palaa: poistetaan katkaisu ja laukaistaan online-tapahtuma.
  await page.unroute(`${API}/loyda`);
  await page.route(`${API}/loyda`, (route) => {
    mock.postit.push({ body: route.request().postDataJSON(), salasana: undefined });
    return route.fulfill({ status: 201, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
  });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));

  await expect.poll(() => mock.postit.length).toBe(1);
  expect(mock.postit[0].body).toMatchObject({ nimi: "Offline-Olli", paikkaId: "neittava-1" });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("viinakatkoily.loytojono") ?? "[]").length)).toBe(0);
});

test("toisella laitteella aloitettu etsintä palautuu nimimerkillä", async ({ page }) => {
  const mock = await mockaaApi(page);
  // Toinen laite aloitti etsinnän 10 min sitten samalla nimimerkillä (kirjainkoko eri).
  mock.etsinnat = [
    { alueAvain: "neittava", nimi: "OLLI", alkoi: new Date(Date.now() - 600_000).toISOString(), sijainti: null },
  ];
  await page.goto("./");
  expect(await page.evaluate(() => localStorage.getItem("viinakatkoily.etsinta.neittava"))).toBeNull();

  await page.getByLabel("Nimimerkki").fill("olli");
  await page.getByRole("button", { name: "Tallenna" }).click();

  await expect
    .poll(() => page.evaluate(() => Number(localStorage.getItem("viinakatkoily.etsinta.neittava"))))
    .toBeGreaterThan(Date.now() - 700_000);
  const alkoi = await page.evaluate(() => Number(localStorage.getItem("viinakatkoily.etsinta.neittava")));
  expect(alkoi).toBeLessThan(Date.now() - 500_000);
});
