import type { CurrencyCode, Hole, ScoringMode } from "../../types";

export type CreateRoundInput = {
  name: string;
  courseName: string;
  holeCount: 9 | 18;
  players: Array<{ name: string; handicap: number }>;
  holes: Hole[];
  scoringMode: ScoringMode;
  stakePerSkinCents: number;
  carryoversEnabled: boolean;
  currency: CurrencyCode;
};
