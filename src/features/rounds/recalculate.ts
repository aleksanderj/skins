import type { Round } from "../../types";
import { calculateSkinResults } from "../../utils/skins";

/** Re-derives skinResults from the round's current scores. Never stores anything scores can't reproduce. */
export function recalculateSkinResults(round: Round): Round {
  return { ...round, skinResults: calculateSkinResults(round) };
}
