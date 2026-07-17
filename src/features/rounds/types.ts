import type {
  ChallengeType,
  CurrencyCode,
  GameFormat,
  HandicapAllowancePercent,
  Hole,
  MatchPlayMode,
  MatchPlayStructure,
  MatchPlayTieRule,
  ScoringMode,
} from "../../types";

export type CreateRoundPlayerInput = { name: string; handicap: number };

/** A challenge set up during round creation — gets an id and winnerPlayerId: null once the round is built (see buildRoundFromInput). */
export type CreateRoundChallengeInput = {
  type: ChallengeType;
  holeNumber: number;
  stakeCents: number;
};

export type CreateRoundInput = {
  name: string;
  courseName: string;
  holeCount: 9 | 18;
  players: CreateRoundPlayerInput[];
  holes: Hole[];
  format: GameFormat;
  currency: CurrencyCode;

  // Skins — required when format === "skins"
  scoringMode?: ScoringMode;
  stakePerSkinCents?: number;
  carryoversEnabled?: boolean;

  // Match Play — required when format === "match_play"
  matchPlayMode?: MatchPlayMode;
  matchPlayScoringMode?: ScoringMode;
  handicapAllowancePercent?: HandicapAllowancePercent;
  matchPlayStructure?: MatchPlayStructure;
  matchPlayStakeCents?: number;
  matchPlayTieRule?: MatchPlayTieRule;
  /** Team names + assignments, indexed by player position in `players`. Required for team mode. */
  teamAssignments?: Array<{ teamIndex: 0 | 1 }>;
  teamNames?: [string, string];

  /** Side bets (closest to the pin / longest drive) set up at round creation — see "Adding challenges" in CLAUDE.md. */
  challenges?: CreateRoundChallengeInput[];
};
