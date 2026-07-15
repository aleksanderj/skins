/** "A" or "B" identifies which side of the match, before mapping back to a real sideId. */
export type SideLabel = "A" | "B";

/** Lowest score wins the hole; equal scores halve it. */
export function calculateIndividualMatchPlayHole(
  sideAScore: number,
  sideBScore: number
): SideLabel | null {
  if (sideAScore < sideBScore) return "A";
  if (sideBScore < sideAScore) return "B";
  return null;
}

/**
 * Simplified team best-ball: each team's hole score is the lowest score
 * recorded by either of its members, then compared exactly like an
 * individual hole.
 */
export function calculateTeamMatchPlayHole(
  sideAScores: number[],
  sideBScores: number[]
): SideLabel | null {
  const bestA = Math.min(...sideAScores);
  const bestB = Math.min(...sideBScores);
  return calculateIndividualMatchPlayHole(bestA, bestB);
}

/** Pure reducer: applies one hole's winner to the running match status. */
export function calculateMatchStatus(previousStatus: number, holeWinner: SideLabel | null): number {
  if (holeWinner === "A") return previousStatus + 1;
  if (holeWinner === "B") return previousStatus - 1;
  return previousStatus;
}

/**
 * Dormie: the trailing side would need to win every remaining hole just to
 * draw level. Only meaningful while the match is still undecided — once
 * `isMatchComplete` is true the match has moved past dormie into "won".
 */
export function isDormie(status: number, holesRemaining: number, matchComplete: boolean): boolean {
  if (matchComplete || holesRemaining <= 0) return false;
  return Math.abs(status) === holesRemaining;
}

/** The match is mathematically decided once the leader's advantage exceeds what's left to play. */
export function isMatchComplete(status: number, holesRemaining: number): boolean {
  return Math.abs(status) > holesRemaining;
}
