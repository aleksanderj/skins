import { z } from "zod";
import { MAX_HANDICAP, MAX_PLAYERS, MIN_HANDICAP, MIN_PLAYERS } from "../constants/golf";

export const currencyCodeSchema = z.enum(["USD", "EUR", "GBP", "NOK"]);
export const scoringModeSchema = z.enum(["gross", "net"]);
export const holeCountSchema = z.union([z.literal(9), z.literal(18)]);
export const gameFormatSchema = z.enum(["skins", "match_play"]);
export const matchPlayModeSchema = z.enum(["individual", "team"]);
export const matchPlayTieRuleSchema = z.enum(["halve", "playoff"]);
export const matchPlayStructureSchema = z.enum(["single_match", "nassau"]);
export const handicapAllowanceSchema = z.union([z.literal(100), z.literal(90), z.literal(85), z.literal(75)]);

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  handicap: z
    .number()
    .min(MIN_HANDICAP, `Handicap must be at least ${MIN_HANDICAP}`)
    .max(MAX_HANDICAP, `Handicap must be ${MAX_HANDICAP} or less`),
});

export const playersArraySchema = z
  .array(playerSchema)
  .min(MIN_PLAYERS, `At least ${MIN_PLAYERS} players are required`)
  .max(MAX_PLAYERS, `No more than ${MAX_PLAYERS} players allowed`)
  .superRefine((players, ctx) => {
    const seen = new Set<string>();
    players.forEach((player, index) => {
      const key = player.name.trim().toLowerCase();
      if (key.length > 0 && seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "Player names must be unique",
          path: [index, "name"],
        });
      }
      seen.add(key);
    });
  });

export const holeSchema = z.object({
  number: z.number().int().positive(),
  par: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  strokeIndex: z.number().int().positive(),
});

export function createHolesArraySchema(holeCount: 9 | 18) {
  return z
    .array(holeSchema)
    .length(holeCount, `A ${holeCount}-hole round needs exactly ${holeCount} holes`)
    .superRefine((holes, ctx) => {
      const indexes = holes.map((h) => h.strokeIndex);
      const uniqueCount = new Set(indexes).size;
      if (uniqueCount !== indexes.length) {
        ctx.addIssue({ code: "custom", message: "Stroke indexes must be unique" });
      }
      const inRange = indexes.every((si) => si >= 1 && si <= holeCount);
      if (!inRange) {
        ctx.addIssue({
          code: "custom",
          message: `Stroke indexes must be between 1 and ${holeCount}`,
        });
      }
    });
}

export const playerHoleScoreSchema = z.object({
  playerId: z.string(),
  holeNumber: z.number().int().positive(),
  grossScore: z.number().int().positive().nullable(),
});

// ---------------------------------------------------------------------------
// Challenges (side bets, format-agnostic)
// ---------------------------------------------------------------------------

export const challengeTypeSchema = z.enum(["closest_to_pin", "longest_drive"]);

export const challengeSchema = z.object({
  id: z.string(),
  type: challengeTypeSchema,
  holeNumber: z.number().int().positive(),
  stakeCents: z.number().int().positive("Stake must be greater than zero"),
  winnerPlayerId: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// Skins
// ---------------------------------------------------------------------------

export const skinsConfigSchema = z.object({
  scoringMode: scoringModeSchema,
  stakePerSkinCents: z.number().int().positive("Stake must be greater than zero"),
  carryoversEnabled: z.boolean(),
});

export const skinResultSchema = z.object({
  holeNumber: z.number().int().positive(),
  winnerPlayerId: z.string().nullable(),
  tiedPlayerIds: z.array(z.string()),
  skinsWon: z.number().int().nonnegative(),
  monetaryValueCents: z.number().int().nonnegative(),
  carriedIntoNextHoleCents: z.number().int().nonnegative(),
});

export const skinsRoundResultSchema = z.object({
  skinResults: z.array(skinResultSchema),
});

/** Legacy alias kept for the game-config form, which only ever edits Skins settings this way. */
export const gameConfigSchema = skinsConfigSchema;

// ---------------------------------------------------------------------------
// Match Play
// ---------------------------------------------------------------------------

export const matchPlayTeamSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Team name is required"),
  playerIds: z.array(z.string()),
});

export const matchPlayConfigSchema = z.object({
  mode: matchPlayModeSchema,
  scoringMode: scoringModeSchema,
  handicapAllowancePercent: handicapAllowanceSchema,
  stakeCents: z.number().int().positive("Stake must be greater than zero"),
  tieRule: matchPlayTieRuleSchema,
  structure: matchPlayStructureSchema,
  teams: z.array(matchPlayTeamSchema).optional(),
});

/**
 * Stricter, form-time validation for Match Play setup — needs holeCount and
 * the player roster in scope to check team composition and the
 * Nassau/9-hole restriction, so it's a factory rather than a static schema.
 */
export function createMatchPlaySetupSchema(holeCount: 9 | 18, playerIds: string[]) {
  return matchPlayConfigSchema.superRefine((config, ctx) => {
    if (config.mode === "individual" && playerIds.length !== 2) {
      ctx.addIssue({ code: "custom", message: "Individual Match Play requires exactly 2 players" });
    }
    if (config.mode === "team") {
      if (playerIds.length !== 4) {
        ctx.addIssue({ code: "custom", message: "Team Match Play requires exactly 4 players" });
      }
      const teams = config.teams ?? [];
      if (teams.length !== 2) {
        ctx.addIssue({ code: "custom", message: "Team Match Play requires exactly 2 teams" });
      } else {
        teams.forEach((team, index) => {
          if (team.playerIds.length !== 2) {
            ctx.addIssue({
              code: "custom",
              message: "Each team must contain exactly 2 players",
              path: ["teams", index, "playerIds"],
            });
          }
        });
        const allAssigned = teams.flatMap((t) => t.playerIds);
        const uniqueAssigned = new Set(allAssigned);
        if (uniqueAssigned.size !== allAssigned.length) {
          ctx.addIssue({ code: "custom", message: "A player cannot belong to both teams" });
        }
        const missing = playerIds.filter((id) => !uniqueAssigned.has(id));
        if (missing.length > 0) {
          ctx.addIssue({ code: "custom", message: "Every player must belong to a team" });
        }
      }
    }
    if (config.structure === "nassau" && holeCount !== 18) {
      ctx.addIssue({ code: "custom", message: "Nassau is only available for 18-hole rounds" });
    }
  });
}

export const matchPlayHoleResultSchema = z.object({
  holeNumber: z.number().int().positive(),
  sideAScore: z.number().nullable(),
  sideBScore: z.number().nullable(),
  winnerSideId: z.string().nullable(),
  statusAfterHole: z.number().int(),
  holesRemaining: z.number().int().nonnegative(),
  isDormie: z.boolean(),
  isMatchComplete: z.boolean(),
});

export const matchPlayMatchResultSchema = z.object({
  sideAId: z.string(),
  sideBId: z.string(),
  holeResults: z.array(matchPlayHoleResultSchema),
  winnerSideId: z.string().nullable(),
  completionHole: z.number().int().positive().nullable(),
  finalStatus: z.number().int(),
  resultLabel: z.string(),
  isHalved: z.boolean(),
});

export const matchPlayPlayoffResultSchema = z.object({
  playoffHoleNumber: z.number().int().positive(),
  sourceHoleNumber: z.number().int().positive(),
  winnerSideId: z.string().nullable(),
});

export const nassauMatchResultSchema = z.object({
  segment: z.enum(["front", "back", "overall"]),
  startHole: z.number().int().positive(),
  endHole: z.number().int().positive(),
  status: z.number().int(),
  completed: z.boolean(),
  winnerSideId: z.string().nullable(),
  resultLabel: z.string().nullable(),
  holeResults: z.array(matchPlayHoleResultSchema),
});

export const matchPlayRoundResultSchema = z.object({
  structure: matchPlayStructureSchema,
  singleMatch: matchPlayMatchResultSchema.optional(),
  nassauMatches: z.array(nassauMatchResultSchema).optional(),
  playoffResults: z.array(matchPlayPlayoffResultSchema).optional(),
  playerBalancesCents: z.record(z.string(), z.number().int()),
});

// ---------------------------------------------------------------------------
// Round setup (Create Round form)
// ---------------------------------------------------------------------------

export const roundSetupSchema = z.object({
  name: z.string().trim().min(1, "Round name is required"),
  courseName: z.string().trim().min(1, "Course name is required"),
  holeCount: holeCountSchema,
});

// ---------------------------------------------------------------------------
// Persisted Round (both formats)
// ---------------------------------------------------------------------------

const baseRoundFields = {
  id: z.string(),
  name: z.string(),
  courseName: z.string(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  holeCount: holeCountSchema,
  currentHole: z.number().int().positive(),
  status: z.enum(["setup", "active", "completed"]),
  currency: currencyCodeSchema,
  players: z.array(playerSchema),
  holes: z.array(holeSchema),
  scores: z.array(playerHoleScoreSchema),
  challenges: z.array(challengeSchema).optional(),
};

export const skinsRoundSchema = z.object({
  ...baseRoundFields,
  format: z.literal("skins"),
  skinsConfig: skinsConfigSchema,
  skinsResult: skinsRoundResultSchema.optional(),
  matchPlayConfig: matchPlayConfigSchema.optional(),
  matchPlayResult: matchPlayRoundResultSchema.optional(),
  matchPlayPlayoffScores: z.array(playerHoleScoreSchema).optional(),
});

export const matchPlayRoundSchema = z.object({
  ...baseRoundFields,
  format: z.literal("match_play"),
  matchPlayConfig: matchPlayConfigSchema,
  matchPlayResult: matchPlayRoundResultSchema.optional(),
  matchPlayPlayoffScores: z.array(playerHoleScoreSchema).optional(),
  skinsConfig: skinsConfigSchema.optional(),
  skinsResult: skinsRoundResultSchema.optional(),
});

export const roundSchema = z.discriminatedUnion("format", [skinsRoundSchema, matchPlayRoundSchema]);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const skinsDefaultsSchema = z.object({
  scoringMode: scoringModeSchema,
  stakePerSkinCents: z.number().int().positive(),
  carryoversEnabled: z.boolean(),
});

export const matchPlayDefaultsSchema = z.object({
  mode: matchPlayModeSchema,
  scoringMode: scoringModeSchema,
  handicapAllowancePercent: handicapAllowanceSchema,
  structure: matchPlayStructureSchema,
  stakeCents: z.number().int().positive(),
  tieRule: matchPlayTieRuleSchema,
});

export const appSettingsSchema = z.object({
  skinsDefaults: skinsDefaultsSchema,
  matchPlayDefaults: matchPlayDefaultsSchema,
  currency: currencyCodeSchema,
});

// ---------------------------------------------------------------------------
// Persisted app state
// ---------------------------------------------------------------------------

export const persistedStateSchema = z.object({
  schemaVersion: z.literal(3),
  activeRound: roundSchema.nullable(),
  roundHistory: z.array(roundSchema),
  settings: appSettingsSchema,
  hasCompletedOnboarding: z.boolean(),
});

export type PersistedState = z.infer<typeof persistedStateSchema>;
