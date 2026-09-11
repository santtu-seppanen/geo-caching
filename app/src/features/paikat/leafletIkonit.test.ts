import { describe, it, expect } from "vitest";
import L from "leaflet";
import { oletusIkoni, loydettyIkoni } from "./leafletIkonit";

describe("leafletIkonit", () => {
  it("oletusIkoni ja loydettyIkoni eivät kaada Markerin lisäystä karttaan", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const kartta = L.map(div).setView([60.17, 24.94], 14);

    // Aiemmin `icon={undefined}` ylikirjoitti Leafletin sisäänrakennetun
    // oletusikonin, mikä kaatoi koko kartan renderöinnin (tyhjä sivu).
    expect(() => new L.Marker([60.17, 24.94], { icon: oletusIkoni }).addTo(kartta)).not.toThrow();
    expect(() =>
      new L.Marker([60.17, 24.94], { icon: loydettyIkoni }).addTo(kartta),
    ).not.toThrow();
  });
});
