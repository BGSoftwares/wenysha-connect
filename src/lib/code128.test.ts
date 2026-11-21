import { describe, expect, it } from "vitest";
import { code128Widths } from "./code128";

describe("code128Widths", () => {
  it("encodes a known value with the start B code, checksum and stop", () => {
    // "A": start B (104) + 'A' (33) + checksum (104 + 33*1) % 103 = 34 + stop
    const widths = code128Widths("A");
    expect(widths.slice(0, 6)).toEqual([2, 1, 1, 2, 1, 4]); // start B 211214
    expect(widths.slice(-7)).toEqual([2, 3, 3, 1, 1, 1, 2]); // stop 2331112
    expect(widths.reduce((a, b) => a + b, 0)).toBe(11 * 3 + 13);
  });

  it("refuses characters it cannot draw", () => {
    expect(() => code128Widths("é")).toThrow();
  });
});
