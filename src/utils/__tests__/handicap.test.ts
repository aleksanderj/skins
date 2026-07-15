import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../handicap";

describe("calculatePlayingHandicap", () => {
  it("rounds an 18-hole handicap to the nearest whole number", () => {
    expect(calculatePlayingHandicap(10.4, 18)).toBe(10);
    expect(calculatePlayingHandicap(10.5, 18)).toBe(11);
  });

  it("halves and rounds for 9-hole rounds", () => {
    expect(calculatePlayingHandicap(10, 9)).toBe(5);
    expect(calculatePlayingHandicap(9, 9)).toBe(5); // round(9/2) = round(4.5) = 5
    expect(calculatePlayingHandicap(22, 9)).toBe(11);
  });
});

describe("getHandicapStrokesForHole", () => {
  it("gives a stroke on stroke-index holes 1-10 for a handicap of 10", () => {
    expect(getHandicapStrokesForHole(10, 1, 18)).toBe(1);
    expect(getHandicapStrokesForHole(10, 10, 18)).toBe(1);
    expect(getHandicapStrokesForHole(10, 11, 18)).toBe(0);
    expect(getHandicapStrokesForHole(10, 18, 18)).toBe(0);
  });

  it("gives one stroke on every hole for a handicap of 18", () => {
    for (let si = 1; si <= 18; si++) {
      expect(getHandicapStrokesForHole(18, si, 18)).toBe(1);
    }
  });

  it("gives a second stroke on stroke-index holes 1-4 for a handicap of 22", () => {
    expect(getHandicapStrokesForHole(22, 1, 18)).toBe(2);
    expect(getHandicapStrokesForHole(22, 4, 18)).toBe(2);
    expect(getHandicapStrokesForHole(22, 5, 18)).toBe(1);
    expect(getHandicapStrokesForHole(22, 18, 18)).toBe(1);
  });

  it("returns 0 strokes for a scratch (0) handicap", () => {
    expect(getHandicapStrokesForHole(0, 1, 18)).toBe(0);
  });
});

describe("calculateNetScore", () => {
  it("subtracts strokes from gross", () => {
    expect(calculateNetScore(5, 1)).toBe(4);
    expect(calculateNetScore(5, 0)).toBe(5);
    expect(calculateNetScore(5, 2)).toBe(3);
  });

  it("passes through null for an unentered score", () => {
    expect(calculateNetScore(null, 1)).toBeNull();
  });
});
