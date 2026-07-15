import type {
  HandicapAllowancePercent,
  Hole,
  MatchPlayMode,
  MatchPlayStructure,
  MatchPlayTeam,
  MatchPlayTieRule,
  Player,
  PlayerHoleScore,
  Round,
  ScoringMode,
} from "../types";

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

/**
 * Builds PlayerHoleScore[] from a compact grid: one row per hole (1-indexed
 * in order), one column per player (matching `playerIds` order). A `null`
 * cell leaves that player's score for that hole unentered.
 */
export function makeHoleScores(playerIds: string[], grid: Array<Array<number | null>>): PlayerHoleScore[] {
  const scores: PlayerHoleScore[] = [];
  grid.forEach((row, holeIdx) => {
    row.forEach((grossScore, playerIdx) => {
      scores.push({ playerId: playerIds[playerIdx], holeNumber: holeIdx + 1, grossScore });
    });
  });
  return scores;
}

export function makeTeams(teamAPlayers: Player[], teamBPlayers: Player[], namesA = "Team A", namesB = "Team B"): MatchPlayTeam[] {
  return [
    { id: "team_a", name: namesA, playerIds: teamAPlayers.map((p) => p.id) },
    { id: "team_b", name: namesB, playerIds: teamBPlayers.map((p) => p.id) },
  ];
}

type SkinsRoundOverrides = Partial<Round> & {
  scoringMode?: ScoringMode;
  stakePerSkinCents?: number;
  carryoversEnabled?: boolean;
};

export function makeRound(overrides: SkinsRoundOverrides = {}): Round {
  const holeCount = overrides.holeCount ?? 18;
  const players = overrides.players ?? makePlayers(2);
  const { scoringMode, stakePerSkinCents, carryoversEnabled, ...rest } = overrides;

  return {
    id: "round_1",
    name: "Test Round",
    courseName: "Test Course",
    createdAt: new Date().toISOString(),
    completedAt: null,
    holeCount,
    currentHole: 1,
    status: "active",
    format: "skins",
    currency: "USD",
    players,
    holes: makeHoles(holeCount),
    scores: [],
    skinsConfig: {
      scoringMode: scoringMode ?? "gross",
      stakePerSkinCents: stakePerSkinCents ?? 500,
      carryoversEnabled: carryoversEnabled ?? true,
    },
    skinsResult: { skinResults: [] },
    ...rest,
  };
}

type MatchPlayRoundOverrides = Partial<Round> & {
  matchPlayMode?: MatchPlayMode;
  matchPlayScoringMode?: ScoringMode;
  handicapAllowancePercent?: HandicapAllowancePercent;
  matchPlayStakeCents?: number;
  matchPlayTieRule?: MatchPlayTieRule;
  matchPlayStructure?: MatchPlayStructure;
  teams?: MatchPlayTeam[];
};

export function makeMatchPlayRound(overrides: MatchPlayRoundOverrides = {}): Round {
  const holeCount = overrides.holeCount ?? 18;
  const players = overrides.players ?? makePlayers(2);
  const {
    matchPlayMode,
    matchPlayScoringMode,
    handicapAllowancePercent,
    matchPlayStakeCents,
    matchPlayTieRule,
    matchPlayStructure,
    teams,
    ...rest
  } = overrides;

  return {
    id: "round_mp_1",
    name: "Test Match",
    courseName: "Test Course",
    createdAt: new Date().toISOString(),
    completedAt: null,
    holeCount,
    currentHole: 1,
    status: "active",
    format: "match_play",
    currency: "USD",
    players,
    holes: makeHoles(holeCount),
    scores: [],
    matchPlayConfig: {
      mode: matchPlayMode ?? "individual",
      scoringMode: matchPlayScoringMode ?? "gross",
      handicapAllowancePercent: handicapAllowancePercent ?? 100,
      stakeCents: matchPlayStakeCents ?? 2000,
      tieRule: matchPlayTieRule ?? "halve",
      structure: matchPlayStructure ?? "single_match",
      teams,
    },
    matchPlayPlayoffScores: [],
    ...rest,
  };
}
