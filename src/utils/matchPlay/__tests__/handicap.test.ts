import {
  calculateAdjustedHandicap,
  calculateRelativeMatchPlayHandicaps,
  getMatchPlayStrokesForHole,
} from "../handicap";
import { makePlayers } from "../../../test-utils/roundFactory";

describe("calculateAdjustedHandicap", () => {
  it("applies 100% allowance as a no-op", () => {
    expect(calculateAdjustedHandicap(14, 18, 100)).toBe(14);
  });

  it("applies a reduced allowance percentage", () => {
    // playing handicap 14 * 90% = 12.6 -> rounds to 13
    expect(calculateAdjustedHandicap(14, 18, 90)).toBe(13);
    expect(calculateAdjustedHandicap(20, 18, 75)).toBe(15);
  });

  it("normalizes for 9-hole rounds before applying the allowance", () => {
    // handicap 14 -> 9-hole normalized to round(14/2)=7 -> * 100% = 7
    expect(calculateAdjustedHandicap(14, 9, 100)).toBe(7);
  });
});

describe("calculateRelativeMatchPlayHandicaps", () => {
  it("gives two equal-handicap players both zero strokes", () => {
    const players = makePlayers(2, [10, 10]);
    const relative = calculateRelativeMatchPlayHandicaps(players, 18, 100);
    expect(relative.p1).toBe(0);
    expect(relative.p2).toBe(0);
  });

  it("gives the low player zero and the high player the difference", () => {
    // Player A: 6, Player B: 14 -> A plays from 0, B receives 8
    const players = makePlayers(2, [6, 14]);
    const relative = calculateRelativeMatchPlayHandicaps(players, 18, 100);
    expect(relative.p1).toBe(0);
    expect(relative.p2).toBe(8);
  });

  it("applies the allowance percentage before taking the relative difference", () => {
    // Adjusted: 6*90%=5.4->5, 14*90%=12.6->13. Relative: 0, 8.
    const players = makePlayers(2, [6, 14]);
    const relative = calculateRelativeMatchPlayHandicaps(players, 18, 90);
    expect(relative.p1).toBe(0);
    expect(relative.p2).toBe(8);
  });

  it("computes relative handicaps across four team players from the lowest of all four", () => {
    const players = makePlayers(4, [5, 10, 14, 18]);
    const relative = calculateRelativeMatchPlayHandicaps(players, 18, 100);
    expect(relative.p1).toBe(0);
    expect(relative.p2).toBe(5);
    expect(relative.p3).toBe(9);
    expect(relative.p4).toBe(13);
  });
});

describe("getMatchPlayStrokesForHole", () => {
  it("gives a player one stroke on their allotted stroke-index holes", () => {
    // relative handicap 8 -> one stroke on stroke index holes 1-8
    expect(getMatchPlayStrokesForHole(8, 1, 18)).toBe(1);
    expect(getMatchPlayStrokesForHole(8, 8, 18)).toBe(1);
    expect(getMatchPlayStrokesForHole(8, 9, 18)).toBe(0);
  });

  it("gives a player two strokes on a hole when the relative handicap requires it", () => {
    // relative handicap 22 on 18 holes -> base 1 stroke everywhere, plus a
    // second stroke on stroke-index holes 1-4
    expect(getMatchPlayStrokesForHole(22, 1, 18)).toBe(2);
    expect(getMatchPlayStrokesForHole(22, 4, 18)).toBe(2);
    expect(getMatchPlayStrokesForHole(22, 5, 18)).toBe(1);
  });

  it("respects the stroke index ordering, not just hole number", () => {
    // relative handicap 3 -> strokes go to the 3 lowest stroke-index holes,
    // regardless of their hole numbers.
    expect(getMatchPlayStrokesForHole(3, 3, 18)).toBe(1);
    expect(getMatchPlayStrokesForHole(3, 4, 18)).toBe(0);
  });
});
