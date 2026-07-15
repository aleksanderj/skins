/**
 * Simplified MVP handicap model — no course/slope rating, just the
 * player's entered handicap allocated across stroke-index holes.
 */

/**
 * Rounds the player's entered handicap to a whole-number "playing handicap".
 * For 9-hole rounds the full handicap is halved and rounded, per the MVP
 * simplification documented in the product spec (a real course handicap
 * would use the front/back nine rating, which this app does not model).
 */
export function calculatePlayingHandicap(handicap: number, holeCount: 9 | 18): number {
  const fullHandicap = Math.round(handicap);
  if (holeCount === 9) {
    return Math.round(fullHandicap / 2);
  }
  return fullHandicap;
}

/**
 * Allocates handicap strokes to a hole using the standard stroke-index
 * method: every hole gets `floor(playingHandicap / holeCount)` strokes,
 * and the hardest `playingHandicap % holeCount` holes (lowest stroke index)
 * get one additional stroke.
 */
export function getHandicapStrokesForHole(
  playingHandicap: number,
  holeStrokeIndex: number,
  holeCount: 9 | 18
): number {
  if (playingHandicap <= 0) return 0;
  const baseStrokes = Math.floor(playingHandicap / holeCount);
  const remainder = playingHandicap % holeCount;
  const extraStroke = holeStrokeIndex <= remainder ? 1 : 0;
  return baseStrokes + extraStroke;
}

export function calculateNetScore(grossScore: number | null, strokes: number): number | null {
  if (grossScore === null) return null;
  return grossScore - strokes;
}
