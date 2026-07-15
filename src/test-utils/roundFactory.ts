import type { Hole, Player, PlayerHoleScore, Round } from "../types";

export function makePlayers(count: number, handicaps: number[] = []): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    handicap: handicaps[i] ?? 0,
  }));
}

export function makeHoles(holeCount: 9 | 18): Hole[] {
  return Array.from({ length: holeCount }, (_, i) => ({
    number: i + 1,
    par: 4 as const,
    strokeIndex: i + 1,
  }));
}

export function makeScores(
  entries: Array<{ playerId: string; holeNumber: number; grossScore: number | null }>
): PlayerHoleScore[] {
  return entries;
}

export function makeRound(overrides: Partial<Round> = {}): Round {
  const holeCount = overrides.holeCount ?? 18;
  const players = overrides.players ?? makePlayers(2);
  return {
    id: "round_1",
    name: "Test Round",
    courseName: "Test Course",
    createdAt: new Date().toISOString(),
    completedAt: null,
    holeCount,
    currentHole: 1,
    status: "active",
    scoringMode: "gross",
    stakePerSkinCents: 500,
    carryoversEnabled: true,
    currency: "USD",
    players,
    holes: makeHoles(holeCount),
    scores: [],
    skinResults: [],
    ...overrides,
  };
}
