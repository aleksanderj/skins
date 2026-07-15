import { calculateMatchPlayResult, formatMatchPlayResult } from "../result";
import type { MatchPlayHoleResult } from "../../../types";

function hole(overrides: Partial<MatchPlayHoleResult>): MatchPlayHoleResult {
  return {
    holeNumber: 1,
    sideAScore: 4,
    sideBScore: 4,
    winnerSideId: null,
    statusAfterHole: 0,
    holesRemaining: 17,
    isDormie: false,
    isMatchComplete: false,
    ...overrides,
  };
}

describe("formatMatchPlayResult", () => {
  it("formats a match decided before the final hole as N & M", () => {
    expect(formatMatchPlayResult({ isHalved: false, holesRemainingAtCompletion: 2, finalStatus: 3 })).toBe("3 & 2");
  });

  it("formats a match decided on the final hole as N Up", () => {
    expect(formatMatchPlayResult({ isHalved: false, holesRemainingAtCompletion: 0, finalStatus: 1 })).toBe("1 Up");
  });

  it("formats a regulation tie as Match Halved", () => {
    expect(formatMatchPlayResult({ isHalved: true, holesRemainingAtCompletion: null, finalStatus: 0 })).toBe(
      "Match Halved"
    );
  });

  it("formats a playoff finish", () => {
    expect(
      formatMatchPlayResult({
        isHalved: false,
        holesRemainingAtCompletion: null,
        finalStatus: 0,
        playoffHoleNumber: 2,
      })
    ).toBe("Won on Playoff Hole 2");
  });

  it("uses holesRemainingAtCompletion directly rather than deriving it from an absolute hole number", () => {
    // Regression test: a Nassau back-nine segment can be decided on round
    // hole 14 (absolute) while only 9 holes into its own 9-hole segment —
    // holeCount(9) - completionHole(14) would wrongly give -5.
    expect(formatMatchPlayResult({ isHalved: false, holesRemainingAtCompletion: 4, finalStatus: 5 })).toBe("5 & 4");
  });
});

describe("calculateMatchPlayResult", () => {
  it("ends the match 3 & 2 when decided at hole 16 of 18", () => {
    const holeResults: MatchPlayHoleResult[] = [
      hole({ holeNumber: 16, statusAfterHole: 3, holesRemaining: 2, isMatchComplete: true, winnerSideId: "A" }),
    ];
    const result = calculateMatchPlayResult("A", "B", holeResults, 18);
    expect(result.winnerSideId).toBe("A");
    expect(result.completionHole).toBe(16);
    expect(result.resultLabel).toBe("3 & 2");
    expect(result.isHalved).toBe(false);
  });

  it("ends the match 1 Up when decided on the final hole", () => {
    const holeResults: MatchPlayHoleResult[] = [
      hole({ holeNumber: 18, statusAfterHole: 1, holesRemaining: 0, isMatchComplete: true, winnerSideId: "A" }),
    ];
    const result = calculateMatchPlayResult("A", "B", holeResults, 18);
    expect(result.winnerSideId).toBe("A");
    expect(result.resultLabel).toBe("1 Up");
  });

  it("halves a regulation match that finishes all square", () => {
    const holeResults: MatchPlayHoleResult[] = Array.from({ length: 18 }, (_, i) =>
      hole({ holeNumber: i + 1, statusAfterHole: 0, holesRemaining: 17 - i, isMatchComplete: false })
    );
    const result = calculateMatchPlayResult("A", "B", holeResults, 18);
    expect(result.isHalved).toBe(true);
    expect(result.winnerSideId).toBeNull();
    expect(result.resultLabel).toBe("Match Halved");
  });

  it("freezes the official result at the first decisive hole even if later holes are recorded", () => {
    const holeResults: MatchPlayHoleResult[] = [
      hole({ holeNumber: 16, statusAfterHole: 3, holesRemaining: 2, isMatchComplete: true, winnerSideId: "A" }),
      // scorecard-only continuation
      hole({ holeNumber: 17, statusAfterHole: 3, holesRemaining: 1, isMatchComplete: true, winnerSideId: "B" }),
      hole({ holeNumber: 18, statusAfterHole: 3, holesRemaining: 0, isMatchComplete: true, winnerSideId: null }),
    ];
    const result = calculateMatchPlayResult("A", "B", holeResults, 18);
    expect(result.completionHole).toBe(16);
    expect(result.resultLabel).toBe("3 & 2");
  });

  it("resolves a halved regulation match via a decisive playoff hole", () => {
    const holeResults: MatchPlayHoleResult[] = Array.from({ length: 18 }, (_, i) =>
      hole({ holeNumber: i + 1, statusAfterHole: 0, holesRemaining: 17 - i })
    );
    const result = calculateMatchPlayResult("A", "B", holeResults, 18, [
      { playoffHoleNumber: 1, sourceHoleNumber: 1, winnerSideId: null },
      { playoffHoleNumber: 2, sourceHoleNumber: 2, winnerSideId: "B" },
    ]);
    expect(result.isHalved).toBe(false);
    expect(result.winnerSideId).toBe("B");
    expect(result.resultLabel).toBe("Won on Playoff Hole 2");
  });
});
