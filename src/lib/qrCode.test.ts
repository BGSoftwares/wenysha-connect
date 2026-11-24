import { describe, expect, it } from "vitest";
import { qrMatrix } from "./qrCode";

describe("qrMatrix", () => {
  it("picks the smallest version that fits and draws the fixed patterns", () => {
    const small = qrMatrix("hi")!;
    expect(small).toHaveLength(21);
    // Finder pattern top-left: solid 7x7 ring with a 3x3 centre.
    expect(small[0].slice(0, 7).every(Boolean)).toBe(true);
    expect(small[3][3]).toBe(true);
    expect(small[1][1]).toBe(false);
    // Timing pattern alternates along row 6, including column 8 which the format area borders.
    expect(small[6][8]).toBe(true);
    expect(small[6][9]).toBe(false);
    expect(small[8][6]).toBe(true);
    // Dark module.
    expect(small[small.length - 8][8]).toBe(true);
  });

  it("grows with the content and rejects text that is too long", () => {
    const url = "https://portal.example.co.zw/student?open=report-card&exam=12&student=345";
    expect(qrMatrix(url)).toHaveLength(37);
    expect(qrMatrix("x".repeat(300))).toBeNull();
  });

  it("is deterministic", () => {
    expect(qrMatrix("same")).toEqual(qrMatrix("same"));
  });
});
