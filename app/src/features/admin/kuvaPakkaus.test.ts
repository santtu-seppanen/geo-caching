import { describe, it, expect } from "vitest";
import { skaalattuKoko } from "./kuvaPakkaus";

describe("skaalattuKoko", () => {
  it("ei muuta kokoa kun kuva mahtuu jo rajaan", () => {
    expect(skaalattuKoko(800, 600, 1600)).toEqual({ leveys: 800, korkeus: 600 });
  });

  it("skaalaa leveämmän sivun mukaan säilyttäen kuvasuhteen", () => {
    const tulos = skaalattuKoko(4000, 2000, 1600);
    expect(tulos.leveys).toBe(1600);
    expect(tulos.korkeus).toBe(800);
  });

  it("skaalaa korkeamman sivun mukaan säilyttäen kuvasuhteen", () => {
    const tulos = skaalattuKoko(2000, 4000, 1600);
    expect(tulos.leveys).toBe(800);
    expect(tulos.korkeus).toBe(1600);
  });

  it("skaalaa neliökuvan molemmat sivut rajaan", () => {
    expect(skaalattuKoko(3000, 3000, 1600)).toEqual({ leveys: 1600, korkeus: 1600 });
  });

  it("ei skaalaa ylöspäin pientä kuvaa", () => {
    expect(skaalattuKoko(400, 300, 1600)).toEqual({ leveys: 400, korkeus: 300 });
  });
});
