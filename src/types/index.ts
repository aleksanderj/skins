/**
 * Core data models for Skins and Match Play.
 *
 * Deviation from a plain spec: every monetary field is suffixed `Cents` and
 * stored as an integer number of cents. This is required by the "never rely
 * on floating point for money" rule — a bare `monetaryValue: number` would
 * invite fractional-cent drift across many hole/settlement calculations.
 */

export type Player = {
  id: string;
  name: string;
  /** Full handicap as entered by the user, 0-54. */
  handicap: number;
};

export type Hole = {
  number: number;
  par: 3 | 4 | 5;
  strokeIndex: number;
};

export type PlayerHoleScore = {
  playerId: string;
  holeNumber: number;
  grossScore: number | null;
};

export type ScoringMode = "gross" | "net";
export type RoundStatus = "setup" | "active" | "completed";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "NOK";
export type GameFormat = "skins" | "match_play";

// ---------------------------------------------------------------------------
// Skins
// ---------------------------------------------------------------------------

export type SkinsConfig = {
  scoringMode: ScoringMode;
  stakePerSkinCents: number;
  carryoversEnabled: boolean;
};

export type SkinResult = {
  holeNumber: number;
  winnerPlayerId: string | null;
  tiedPlayerIds: string[];
  /** Number of skins awarded to the winner on this hole (0 if tied). */
  skinsWon: number;
  /** Value of the skins won on this hole, in cents (skinsWon * stakePerSkinCents). */
  monetaryValueCents: number;
  /** Value carried from this hole into the next, in cents. Nonzero only on unresolved ties. */
  carriedIntoNextHoleCents: number;
};

export type SkinsRoundResult = {
  skinResults: SkinResult[];
};

// ---------------------------------------------------------------------------
// Match Play
// ---------------------------------------------------------------------------

export type MatchPlayMode = "individual" | "team";
export type MatchPlayTieRule = "halve" | "playoff";
export type MatchPlayStructure = "single_match" | "nassau";
export type HandicapAllowancePercent = 100 | 90 | 85 | 75;
export type NassauSegment = "front" | "back" | "overall";

export type MatchPlayTeam = {
  id: string;
  name: string;
  playerIds: string[];
};

/**
 * A competing side in a match. For individual mode a side wraps exactly one
 * player; for team mode it wraps a configured MatchPlayTeam. Normalizing
 * both into the same shape lets all hole/status/result math be written once
 * and reused for both modes instead of branching mode-by-mode everywhere.
 */
export type MatchPlaySide = {
  id: string;
  name: string;
  playerIds: string[];
};

export type MatchPlayConfig = {
  mode: MatchPlayMode;
  scoringMode: ScoringMode;
  handicapAllowancePercent: HandicapAllowancePercent;
  stakeCents: number;
  tieRule: MatchPlayTieRule;
  structure: MatchPlayStructure;
  teams?: MatchPlayTeam[];
};

export type MatchPlayHoleResult = {
  holeNumber: number;
  sideAScore: number | null;
  sideBScore: number | null;
  winnerSideId: string | null;
  /** Positive: side A up. Negative: side B up. Zero: All Square. */
  statusAfterHole: number;
  holesRemaining: number;
  isDormie: boolean;
  isMatchComplete: boolean;
};

export type MatchPlayMatchResult = {
  sideAId: string;
  sideBId: string;
  holeResults: MatchPlayHoleResult[];
  winnerSideId: string | null;
  completionHole: number | null;
  finalStatus: number;
  resultLabel: string;
  isHalved: boolean;
};

export type MatchPlayPlayoffResult = {
  playoffHoleNumber: number;
  sourceHoleNumber: number;
  winnerSideId: string | null;
};

export type NassauMatchResult = {
  segment: NassauSegment;
  startHole: number;
  endHole: number;
  status: number;
  completed: boolean;
  winnerSideId: string | null;
  resultLabel: string | null;
  holeResults: MatchPlayHoleResult[];
};

export type MatchPlayRoundResult = {
  structure: MatchPlayStructure;
  singleMatch?: MatchPlayMatchResult;
  nassauMatches?: NassauMatchResult[];
  playoffResults?: MatchPlayPlayoffResult[];
  playerBalancesCents: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Challenges (side bets, format-agnostic)
// ---------------------------------------------------------------------------

export type ChallengeType = "closest_to_pin" | "longest_drive";

/**
 * A single-hole side bet independent of the round's main format — "closest
 * to the pin" or "longest drive" on a specific hole. Resolved by picking a
 * winner (self-reported, like every other score in this app); the stake is
 * the amount every other player owes the winner, same "loser pays winner"
 * model Skins already uses — see calculateChallengeBalances.
 */
export type Challenge = {
  id: string;
  type: ChallengeType;
  holeNumber: number;
  stakeCents: number;
  winnerPlayerId: string | null;
};

// ---------------------------------------------------------------------------
// Round
// ---------------------------------------------------------------------------

export type Round = {
  id: string;
  name: string;
  courseName: string;
  createdAt: string;
  completedAt: string | null;
  holeCount: 9 | 18;
  currentHole: number;
  status: RoundStatus;
  format: GameFormat;
  currency: CurrencyCode;
  players: Player[];
  holes: Hole[];
  scores: PlayerHoleScore[];

  // Skins-only. Present when format === "skins".
  skinsConfig?: SkinsConfig;
  /** Derived cache, always recomputed from `scores` — see recalculateRound. */
  skinsResult?: SkinsRoundResult;

  // Match Play-only. Present when format === "match_play".
  matchPlayConfig?: MatchPlayConfig;
  /** Derived cache, always recomputed from `scores` / `matchPlayPlayoffScores`. */
  matchPlayResult?: MatchPlayRoundResult;
  /**
   * Sudden-death playoff scores, kept separate from regulation `scores` per
   * the product spec. Indexed by a playoff-local `holeNumber` (1, 2, 3, ...)
   * that maps back to a reused course hole via `sourceHoleNumber`, not by
   * the round's real hole numbers.
   */
  matchPlayPlayoffScores?: PlayerHoleScore[];

  /** Side bets set up during the round — independent of format. Optional so legacy persisted rounds without this field still validate. */
  challenges?: Challenge[];
};

// ---------------------------------------------------------------------------
// Settlement (shared engine, format-agnostic)
// ---------------------------------------------------------------------------

export type Settlement = {
  fromPlayerId: string;
  toPlayerId: string;
  amountCents: number;
};

export type PlayerBalance = {
  playerId: string;
  balanceCents: number;
  /** Skins-only display detail; absent for Match Play balances. */
  skinsWon?: number;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type SkinsDefaults = {
  scoringMode: ScoringMode;
  stakePerSkinCents: number;
  carryoversEnabled: boolean;
};

export type MatchPlayDefaults = {
  mode: MatchPlayMode;
  scoringMode: ScoringMode;
  handicapAllowancePercent: HandicapAllowancePercent;
  structure: MatchPlayStructure;
  stakeCents: number;
  tieRule: MatchPlayTieRule;
};

export type AppSettings = {
  skinsDefaults: SkinsDefaults;
  matchPlayDefaults: MatchPlayDefaults;
  currency: CurrencyCode;
};
