import type { Challenge, Player } from "../types";

/**
 * Every player owes the stake to the winner of each decided challenge — the
 * same "loser pays winner" model Skins already uses. Undecided challenges
 * (winnerPlayerId === null) contribute nothing. Zero-sum by construction.
 */
export function calculateChallengeBalances(challenges: Challenge[], players: Player[]): Record<string, number> {
  const balances: Record<string, number> = {};
  players.forEach((p) => {
    balances[p.id] = 0;
  });

  challenges.forEach((challenge) => {
    const winnerId = challenge.winnerPlayerId;
    if (!winnerId || !(winnerId in balances)) return;

    players.forEach((p) => {
      if (p.id === winnerId) return;
      balances[p.id] -= challenge.stakeCents;
      balances[winnerId] += challenge.stakeCents;
    });
  });

  return balances;
}
