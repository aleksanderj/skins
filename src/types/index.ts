/**
 * Core data models for Skins.
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

export type ScoringMode = "gross" | "net";

export type RoundStatus = "setup" | "active" | "completed";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "NOK";

export type Round = {
  id: string;
  name: string;
  courseName: string;
  createdAt: string;
  completedAt: string | null;
  holeCount: 9 | 18;
  currentHole: number;
  status: RoundStatus;
  scoringMode: ScoringMode;
  stakePerSkinCents: number;
  carryoversEnabled: boolean;
  currency: CurrencyCode;
  players: Player[];
  holes: Hole[];
  scores: PlayerHoleScore[];
  /**
   * Derived cache of skin results, recalculated any time a score changes.
   * Kept on the round so completed rounds retain their results without
   * needing to be recomputed from scratch in history.
   */
  skinResults: SkinResult[];
};

export type Settlement = {
  fromPlayerId: string;
  toPlayerId: string;
  amountCents: number;
};

export type PlayerBalance = {
  playerId: string;
  balanceCents: number;
  skinsWon: number;
};

export type AppSettings = {
  defaultScoringMode: ScoringMode;
  defaultStakePerSkinCents: number;
  defaultCarryoversEnabled: boolean;
  currency: CurrencyCode;
};
