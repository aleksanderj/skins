import type { Player, PlayerBalance, SkinResult } from "../types";

/**
 * Friendly multiplayer accounting model: for every skin a player wins,
 * every other player owes them one stake. The winner's gain therefore
 * scales with player count (stake * skins * opponents) while each other
 * player's loss is a flat stake * skins — this keeps the total zero-sum
 * regardless of table size.
 */
export function calculatePlayerBalances(
  players: Player[],
  skinResults: SkinResult[],
  stakePerSkinCents: number
): PlayerBalance[] {
  const balanceCentsById = new Map<string, number>();
  const skinsWonById = new Map<string, number>();
  players.forEach((p) => {
    balanceCentsById.set(p.id, 0);
    skinsWonById.set(p.id, 0);
  });

  for (const result of skinResults) {
    if (!result.winnerPlayerId || result.skinsWon === 0) continue;

    const potCents = result.skinsWon * stakePerSkinCents;
    const winnerId = result.winnerPlayerId;
    const opponents = players.filter((p) => p.id !== winnerId);

    for (const opponent of opponents) {
      balanceCentsById.set(opponent.id, (balanceCentsById.get(opponent.id) ?? 0) - potCents);
    }
    balanceCentsById.set(
      winnerId,
      (balanceCentsById.get(winnerId) ?? 0) + potCents * opponents.length
    );
    skinsWonById.set(winnerId, (skinsWonById.get(winnerId) ?? 0) + result.skinsWon);
  }

  return players.map((p) => ({
    playerId: p.id,
    balanceCents: balanceCentsById.get(p.id) ?? 0,
    skinsWon: skinsWonById.get(p.id) ?? 0,
  }));
}
