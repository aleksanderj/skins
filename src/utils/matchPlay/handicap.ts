import type { Player } from "../../types";
import { calculatePlayingHandicap, getHandicapStrokesForHole } from "../handicap";

/**
 * Applies the configured handicap allowance on top of the normal playing
 * handicap (which already halves for 9-hole rounds — see `handicap.ts`).
 * An allowance of 100% is a no-op; lower allowances reduce strokes
 * proportionally, as is standard in club Match Play.
 */
export function calculateAdjustedHandicap(
  handicap: number,
  holeCount: 9 | 18,
  allowancePercent: number
): number {
  const normalized = calculatePlayingHandicap(handicap, holeCount);
  return Math.round((normalized * allowancePercent) / 100);
}

/**
 * The "low player" method: every player's adjusted handicap is reduced by
 * the lowest adjusted handicap in the group, so the strongest player always
 * plays off zero. Mode-agnostic by design — pass the 2 head-to-head players
 * for Individual Match Play, or all 4 players for Team Match Play, and the
 * same subtraction applies either way (per the product spec's examples).
 */
export function calculateRelativeMatchPlayHandicaps(
  players: Player[],
  holeCount: 9 | 18,
  allowancePercent: number
): Record<string, number> {
  const adjusted = players.map((p) => ({
    id: p.id,
    adjusted: calculateAdjustedHandicap(p.handicap, holeCount, allowancePercent),
  }));
  const lowest = adjusted.length > 0 ? Math.min(...adjusted.map((a) => a.adjusted)) : 0;

  const result: Record<string, number> = {};
  for (const entry of adjusted) {
    result[entry.id] = entry.adjusted - lowest;
  }
  return result;
}

/**
 * Allocates Match Play strokes for a hole from a player's relative handicap.
 * This is the same stroke-index allocation Skins uses — Match Play just
 * feeds it a relative (post-subtraction) handicap instead of a raw one.
 */
export function getMatchPlayStrokesForHole(
  relativeHandicap: number,
  holeStrokeIndex: number,
  holeCount: 9 | 18
): number {
  return getHandicapStrokesForHole(relativeHandicap, holeStrokeIndex, holeCount);
}
