import { describe, it, expect } from "vitest";
import { muotoileKesto } from "./kesto";

describe("muotoileKesto", () => {
  it("muotoilee minuutit ja sekunnit", () => {
    expect(muotoileKesto(252_000)).toBe("4:12");
  });

  it("pyöristää ylöspäin, ettei lähtölaskenta näytä 0:00 ennen aikaa", () => {
    expect(muotoileKesto(500)).toBe("0:01");
  });

  it("lisää tunnit tarvittaessa", () => {
    expect(muotoileKesto(3_725_000)).toBe("1:02:05");
  });
});
