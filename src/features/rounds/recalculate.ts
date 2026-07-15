import type { Round } from "../../types";
import { calculateSkinResults } from "../../utils/skins";
import { calculateMatchPlayRoundResult } from "../../utils/matchPlay";

/**
 * Re-derives the round's cached result from its current scores. Never
 * stores anything scores can't reproduce — this is the one place that
 * bridges "raw input" (`scores`, `matchPlayPlayoffScores`) to "derived
 * output" (`skinsResult` / `matchPlayResult`) for both formats.
 */
export function recalculateRoundResult(round: Round): Round {
  if (round.format === "match_play") {
    return { ...round, matchPlayResult: calculateMatchPlayRoundResult(round) ?? undefined };
  }
  return { ...round, skinsResult: { skinResults: calculateSkinResults(round) } };
}
