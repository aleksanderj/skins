import type { MatchPlayPlayoffResult, MatchPlaySide, Round } from "../../types";
import { calculateTeamMatchPlayHole } from "./holeResult";
import { getSideRawScoresForHole } from "./scoring";

/**
 * Sudden-death playoff: replays the course starting from Hole 1 again,
 * one hole at a time, stopping the instant a side wins one outright. Tied
 * playoff holes simply continue — status never accumulates across playoff
 * holes the way it does in regulation.
 */
export function calculatePlayoffHoleResults(
  round: Round,
  sideA: MatchPlaySide,
  sideB: MatchPlaySide,
  relativeHandicaps: Record<string, number>
): MatchPlayPlayoffResult[] {
  const config = round.matchPlayConfig;
  const playoffScores = round.matchPlayPlayoffScores ?? [];
  if (!config || playoffScores.length === 0) return [];

  const maxPlayoffHoleNumber = Math.max(...playoffScores.map((s) => s.holeNumber));
  const results: MatchPlayPlayoffResult[] = [];

  for (let playoffHoleNumber = 1; playoffHoleNumber <= maxPlayoffHoleNumber; playoffHoleNumber++) {
    const sourceHoleNumber = ((playoffHoleNumber - 1) % round.holeCount) + 1;
    const sourceHole = round.holes.find((h) => h.number === sourceHoleNumber);
    if (!sourceHole) break;

    const scoresA = getSideRawScoresForHole(
      playoffScores,
      playoffHoleNumber,
      sourceHole,
      sideA,
      config,
      relativeHandicaps,
      round.holeCount
    );
    const scoresB = getSideRawScoresForHole(
      playoffScores,
      playoffHoleNumber,
      sourceHole,
      sideB,
      config,
      relativeHandicaps,
      round.holeCount
    );
    if (!scoresA || !scoresB) break;

    const winner = calculateTeamMatchPlayHole(scoresA, scoresB);
    results.push({
      playoffHoleNumber,
      sourceHoleNumber,
      winnerSideId: winner === "A" ? sideA.id : winner === "B" ? sideB.id : null,
    });

    if (winner !== null) break;
  }

  return results;
}
