import type { MatchPlayConfig, MatchPlaySide, Player } from "../../types";

/**
 * Normalizes the round's players/teams into the two generic sides every
 * Match Play calculation operates on. Individual mode wraps each of the 2
 * players as a 1-player side (its id *is* the player id, so a winning side
 * id doubles as a winning player id for display). Team mode uses the
 * configured teams directly.
 */
export function getMatchPlaySides(
  players: Player[],
  config: MatchPlayConfig
): { sideA: MatchPlaySide; sideB: MatchPlaySide } | null {
  if (config.mode === "individual") {
    if (players.length !== 2) return null;
    const [a, b] = players;
    return {
      sideA: { id: a.id, name: a.name, playerIds: [a.id] },
      sideB: { id: b.id, name: b.name, playerIds: [b.id] },
    };
  }

  const teams = config.teams;
  if (!teams || teams.length !== 2) return null;
  const [teamA, teamB] = teams;
  return {
    sideA: { id: teamA.id, name: teamA.name, playerIds: teamA.playerIds },
    sideB: { id: teamB.id, name: teamB.name, playerIds: teamB.playerIds },
  };
}

/** The full set of players whose handicaps matter for this match (2 for individual, 4 for team). */
export function getMatchPlayHandicapPlayers(
  players: Player[],
  sideA: MatchPlaySide,
  sideB: MatchPlaySide
): Player[] {
  const ids = new Set([...sideA.playerIds, ...sideB.playerIds]);
  return players.filter((p) => ids.has(p.id));
}
