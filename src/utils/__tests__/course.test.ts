import { generateDefaultHoles } from "../course";

describe("generateDefaultHoles", () => {
  it("generates 18 holes with a total par near 72 and unique stroke indexes 1-18", () => {
    const holes = generateDefaultHoles(18);
    expect(holes).toHaveLength(18);
    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    expect(totalPar).toBe(72);
    const strokeIndexes = holes.map((h) => h.strokeIndex).sort((a, b) => a - b);
    expect(strokeIndexes).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });

  it("generates 9 holes with a total par near 36 and unique stroke indexes 1-9", () => {
    const holes = generateDefaultHoles(9);
    expect(holes).toHaveLength(9);
    const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
    expect(totalPar).toBe(36);
    const strokeIndexes = holes.map((h) => h.strokeIndex).sort((a, b) => a - b);
    expect(strokeIndexes).toEqual(Array.from({ length: 9 }, (_, i) => i + 1));
  });
});
