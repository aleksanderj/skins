import type { Hole, MatchPlaySide, NassauMatchResult, NassauSegment, Round } from "../../types";
import { calculateMatchPlayResult } from "./result";
import { calculateMatchPlayHoleResults } from "./scoring";

const SEGMENTS: { segment: NassauSegment; startHole: number; endHole: number }[] = [
  { segment: "front", startHole: 1, endHole: 9 },
  { segment: "back", startHole: 10, endHole: 18 },
  { segment: "overall", startHole: 1, endHole: 18 },
];

/**
 * Computes the three independent Nassau bets. Each segment gets its own
 * fresh All Square start and its own early-completion check — the Back
 * Nine match, in particular, must not inherit any status from the Front
 * Nine, and the Overall match tracks across all 18 holes regardless of how
 * the front/back bets individually resolved.
 */
export function calculateNassauMatches(
  round: Round,
  sideA: MatchPlaySide,
  sideB: MatchPlaySide,
  relativeHandicaps: Record<string, number>
): NassauMatchResult[] {
  return SEGMENTS.map(({ segment, startHole, endHole }) => {
    const segmentHoles: Hole[] = round.holes.filter((h) => h.number >= startHole && h.number <= endHole);
    const holeResults = calculateMatchPlayHoleResults(round, sideA, sideB, segmentHoles, relativeHandicaps);
    const matchResult = calculateMatchPlayResult(sideA.id, sideB.id, holeResults, segmentHoles.length);
    const lastEntry = holeResults[holeResults.length - 1];
    const completed = matchResult.winnerSideId !== null || matchResult.isHalved;

    return {
      segment,
      startHole,
      endHole,
      status: lastEntry ? lastEntry.statusAfterHole : 0,
      completed,
      winnerSideId: matchResult.winnerSideId,
      resultLabel: completed ? matchResult.resultLabel : null,
      holeResults,
    };
  });
}
