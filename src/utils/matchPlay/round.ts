import type { MatchPlayRoundResult, Round } from "../../types";
import { calculateNassauBalances, calculateMatchPlayBalances } from "./balances";
import { calculateRelativeMatchPlayHandicaps } from "./handicap";
import { calculateNassauMatches } from "./nassau";
import { calculatePlayoffHoleResults } from "./playoff";
import { calculateMatchPlayResult } from "./result";
import { calculateMatchPlayHoleResults } from "./scoring";
import { getMatchPlayHandicapPlayers, getMatchPlaySides } from "./sides";

/**
 * The Match Play equivalent of `calculateSkinResults` — derives the entire
 * round result fresh from `round.scores` (and `matchPlayPlayoffScores`)
 * every time. Nothing here is mutated in place; the store just swaps in
 * whatever this returns whenever scores or config change.
 */
export function calculateMatchPlayRoundResult(round: Round): MatchPlayRoundResult | null {
  const config = round.matchPlayConfig;
  if (!config) return null;

  const sides = getMatchPlaySides(round.players, config);
  if (!sides) return null;
  const { sideA, sideB } = sides;

  const handicapPlayers = getMatchPlayHandicapPlayers(round.players, sideA, sideB);
  const relativeHandicaps = calculateRelativeMatchPlayHandicaps(handicapPlayers, round.holeCount, config.handicapAllowancePercent);

  if (config.structure === "nassau") {
    const nassauMatches = calculateNassauMatches(round, sideA, sideB, relativeHandicaps);
    const playerBalancesCents = calculateNassauBalances(sideA, sideB, nassauMatches, config.stakeCents);
    return {
      structure: "nassau",
      nassauMatches,
      playerBalancesCents,
    };
  }

  const regulationHoles = round.holes.filter((h) => h.number <= round.holeCount);
  const holeResults = calculateMatchPlayHoleResults(round, sideA, sideB, regulationHoles, relativeHandicaps);
  let matchResult = calculateMatchPlayResult(sideA.id, sideB.id, holeResults, round.holeCount);

  let playoffResults: ReturnType<typeof calculatePlayoffHoleResults> = [];
  if (matchResult.isHalved && config.tieRule === "playoff") {
    playoffResults = calculatePlayoffHoleResults(round, sideA, sideB, relativeHandicaps);
    if (playoffResults.length > 0) {
      matchResult = calculateMatchPlayResult(sideA.id, sideB.id, holeResults, round.holeCount, playoffResults);
    }
  }

  const playerBalancesCents = calculateMatchPlayBalances(sideA, sideB, matchResult, config.stakeCents);

  return {
    structure: "single_match",
    singleMatch: matchResult,
    playoffResults: playoffResults.length > 0 ? playoffResults : undefined,
    playerBalancesCents,
  };
}
