import { describe, it, expect } from "vitest";
import { KATKO_AVAUTUU_METREINA, ALUE_AVAUTUU_METREINA } from "./kynnykset";

describe("kynnykset", () => {
  it("KATKO_AVAUTUU_METREINA on 100", () => {
    expect(KATKO_AVAUTUU_METREINA).toBe(100);
  });

  it("ALUE_AVAUTUU_METREINA on 2000", () => {
    expect(ALUE_AVAUTUU_METREINA).toBe(2000);
  });
});
