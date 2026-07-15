import type { MatchPlayHoleResult, MatchPlayMatchResult, MatchPlayPlayoffResult } from "../../types";

export type FormatMatchPlayResultInput = {
  isHalved: boolean;
  /**
   * Holes remaining in *this match/segment* at the moment it was decided
   * (0 when decided on the last hole), or null if not yet decided. This
   * must come from the deciding MatchPlayHoleResult's own `holesRemaining`
   * field — never be recomputed as `holeCount - completionHole`, since for
   * a Nassau segment `completionHole` is the round's absolute hole number
   * (e.g. 14 for the 5th hole of the back nine) while `holeCount` is the
   * segment's length (9), and subtracting the two gives nonsense.
   */
  holesRemainingAtCompletion: number | null;
  finalStatus: number;
  /** Set only when a sudden-death playoff decided the match. */
  playoffHoleNumber?: number | null;
};

/**
 * Renders the standard Match Play result phrase: "3 & 2" when decided
 * before the last hole, "1 Up" when decided exactly on it, "Match Halved"
 * for a regulation tie, or "Won on Playoff Hole N" for a playoff finish.
 */
export function formatMatchPlayResult(input: FormatMatchPlayResultInput): string {
  if (input.playoffHoleNumber != null) {
    return `Won on Playoff Hole ${input.playoffHoleNumber}`;
  }
  if (input.isHalved) {
    return "Match Halved";
  }
  if (input.holesRemainingAtCompletion === null) {
    return "In Progress";
  }

  const lead = Math.abs(input.finalStatus);

  if (input.holesRemainingAtCompletion === 0) {
    return `${lead} Up`;
  }
  return `${lead} & ${input.holesRemainingAtCompletion}`;
}

/**
 * Reduces a full set of per-hole results (plus any playoff holes) down to
 * the official match outcome. Once a hole result is flagged
 * `isMatchComplete`, that's the frozen, official completion — any later
 * hole results in the array (from "Continue Scoring for Scorecard") are
 * ignored for this summary even though they're still stored on the round.
 */
export function calculateMatchPlayResult(
  sideAId: string,
  sideBId: string,
  holeResults: MatchPlayHoleResult[],
  holeCount: number,
  playoffResults: MatchPlayPlayoffResult[] = []
): MatchPlayMatchResult {
  const decisiveEntry = holeResults.find((r) => r.isMatchComplete);
  const regulationFullyPlayed = holeResults.length === holeCount;
  const lastEntry = holeResults[holeResults.length - 1];

  let winnerSideId: string | null = null;
  let completionHole: number | null = null;
  let holesRemainingAtCompletion: number | null = null;
  let finalStatus = lastEntry ? lastEntry.statusAfterHole : 0;
  let isHalved = false;

  if (decisiveEntry) {
    completionHole = decisiveEntry.holeNumber;
    holesRemainingAtCompletion = decisiveEntry.holesRemaining;
    finalStatus = decisiveEntry.statusAfterHole;
    winnerSideId = finalStatus > 0 ? sideAId : sideBId;
  } else if (regulationFullyPlayed) {
    isHalved = true;
    finalStatus = 0;
  }

  const decisivePlayoffHole = playoffResults.find((p) => p.winnerSideId !== null) ?? null;
  if (isHalved && decisivePlayoffHole) {
    isHalved = false;
    winnerSideId = decisivePlayoffHole.winnerSideId;
  }

  const resultLabel = formatMatchPlayResult({
    isHalved,
    holesRemainingAtCompletion,
    finalStatus,
    playoffHoleNumber: decisivePlayoffHole && winnerSideId ? decisivePlayoffHole.playoffHoleNumber : null,
  });

  return {
    sideAId,
    sideBId,
    holeResults,
    winnerSideId,
    completionHole,
    finalStatus,
    resultLabel,
    isHalved,
  };
}
