import type { Hole, MatchPlayConfig, MatchPlayHoleResult, MatchPlaySide, PlayerHoleScore, Round } from "../../types";
import { getMatchPlayStrokesForHole } from "./handicap";
import { calculateMatchStatus, calculateTeamMatchPlayHole, isDormie, isMatchComplete } from "./holeResult";

/**
 * A side's raw (gross or net) score per member, looked up by an arbitrary
 * `holeNumber` key against an arbitrary score list — shared by regulation
 * scoring (`round.scores` keyed by real hole number) and playoff scoring
 * (`round.matchPlayPlayoffScores` keyed by playoff-local hole number, but
 * still using the *reused* source hole's stroke index for handicap strokes).
 * Returns null if any side member hasn't scored this hole yet.
 */
export function getSideRawScoresForHole(
  scores: PlayerHoleScore[],
  holeNumber: number,
  strokeIndexHole: Hole,
  side: MatchPlaySide,
  config: MatchPlayConfig,
  relativeHandicaps: Record<string, number>,
  roundHoleCount: 9 | 18
): number[] | null {
  const result: number[] = [];
  for (const playerId of side.playerIds) {
    const record = scores.find((s) => s.playerId === playerId && s.holeNumber === holeNumber);
    if (!record || record.grossScore === null) return null;

    if (config.scoringMode === "gross") {
      result.push(record.grossScore);
    } else {
      const strokes = getMatchPlayStrokesForHole(
        relativeHandicaps[playerId] ?? 0,
        strokeIndexHole.strokeIndex,
        roundHoleCount
      );
      result.push(record.grossScore - strokes);
    }
  }
  return result;
}

/**
 * Walks one match's holes in order (a single-match's full round, or one
 * Nassau segment) and produces a MatchPlayHoleResult per completed hole.
 * Stops at the first hole missing a score, same as Skins. Once the match is
 * mathematically decided, later holes are still recorded (for the
 * scorecard) but no longer move `statusAfterHole` — see the product spec's
 * "Continue Scoring for Scorecard" requirement.
 */
export function calculateMatchPlayHoleResults(
  round: Round,
  sideA: MatchPlaySide,
  sideB: MatchPlaySide,
  holes: Hole[],
  relativeHandicaps: Record<string, number>
): MatchPlayHoleResult[] {
  const config = round.matchPlayConfig;
  if (!config) return [];

  const sortedHoles = [...holes].sort((a, b) => a.number - b.number);
  const segmentLength = sortedHoles.length;
  const results: MatchPlayHoleResult[] = [];

  let status = 0;
  let decided = false;

  for (let i = 0; i < sortedHoles.length; i++) {
    const hole = sortedHoles[i];
    const scoresA = getSideRawScoresForHole(round.scores, hole.number, hole, sideA, config, relativeHandicaps, round.holeCount);
    const scoresB = getSideRawScoresForHole(round.scores, hole.number, hole, sideB, config, relativeHandicaps, round.holeCount);
    if (!scoresA || !scoresB) break;

    const holeWinner = calculateTeamMatchPlayHole(scoresA, scoresB);
    if (!decided) {
      status = calculateMatchStatus(status, holeWinner);
    }

    const positionInSegment = i + 1;
    const holesRemaining = segmentLength - positionInSegment;
    if (!decided && isMatchComplete(status, holesRemaining)) {
      decided = true;
    }

    results.push({
      holeNumber: hole.number,
      sideAScore: Math.min(...scoresA),
      sideBScore: Math.min(...scoresB),
      winnerSideId: holeWinner === "A" ? sideA.id : holeWinner === "B" ? sideB.id : null,
      statusAfterHole: status,
      holesRemaining,
      isDormie: isDormie(status, holesRemaining, decided),
      isMatchComplete: decided,
    });
  }

  return results;
}
