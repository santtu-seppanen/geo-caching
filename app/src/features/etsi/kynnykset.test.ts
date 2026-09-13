import { describe, it, expect } from "vitest";
import { KATKO_AVAUTUU_METREINA } from "./kynnykset";

describe("kynnykset", () => {
  it("KATKO_AVAUTUU_METREINA on 100", () => {
    expect(KATKO_AVAUTUU_METREINA).toBe(100);
  });
});
