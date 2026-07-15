import type { PlayerBalance, Round } from "../../types";
import { calculatePlayerBalances } from "../../utils/balances";
import { calculateSettlements } from "../../utils/settlements";

export function getPlayerBalances(round: Round): PlayerBalance[] {
  return calculatePlayerBalances(round.players, round.skinResults, round.stakePerSkinCents);
}

export function getSettlements(round: Round) {
  return calculateSettlements(getPlayerBalances(round));
}

/** Highest balance wins; a shared top balance means the leaderboard is tied. */
export function getLeader(round: Round): { playerId: string; balanceCents: number } | null {
  const balances = getPlayerBalances(round);
  if (balances.length === 0) return null;
  const highest = Math.max(...balances.map((b) => b.balanceCents));
  const leaders = balances.filter((b) => b.balanceCents === highest);
  if (leaders.length !== 1 || highest === 0) return null;
  return { playerId: leaders[0].playerId, balanceCents: leaders[0].balanceCents };
}

export function isHoleComplete(round: Round, holeNumber: number): boolean {
  return round.players.every((p) =>
    round.scores.some(
      (s) => s.playerId === p.id && s.holeNumber === holeNumber && s.grossScore !== null
    )
  );
}

export function getCompletedHoleCount(round: Round): number {
  let count = 0;
  for (let hole = 1; hole <= round.holeCount; hole++) {
    if (isHoleComplete(round, hole)) count++;
    else break;
  }
  return count;
}

export function isRoundReadyToComplete(round: Round): boolean {
  return getCompletedHoleCount(round) === round.holeCount;
}

export function getUnresolvedCarryoverCents(round: Round): number {
  const last = round.skinResults[round.skinResults.length - 1];
  if (!last) return 0;
  if (last.holeNumber !== round.holeCount) return 0;
  return last.carriedIntoNextHoleCents;
}

export function getPlayerName(round: Round, playerId: string): string {
  return round.players.find((p) => p.id === playerId)?.name ?? "Unknown player";
}

export function getHoleScore(round: Round, playerId: string, holeNumber: number): number | null {
  const record = round.scores.find((s) => s.playerId === playerId && s.holeNumber === holeNumber);
  return record?.grossScore ?? null;
}

/** Display-friendly winner summary for round cards on Home and History. */
export function getRoundWinnerSummary(
  round: Round
): { name: string; balanceCents: number } | { name: null; balanceCents: 0 } {
  const leader = getLeader(round);
  if (!leader) return { name: null, balanceCents: 0 };
  return { name: getPlayerName(round, leader.playerId), balanceCents: leader.balanceCents };
}
