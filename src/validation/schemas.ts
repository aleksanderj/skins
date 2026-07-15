import { z } from "zod";
import { MAX_HANDICAP, MAX_PLAYERS, MIN_HANDICAP, MIN_PLAYERS } from "../constants/golf";

export const currencyCodeSchema = z.enum(["USD", "EUR", "GBP", "NOK"]);
export const scoringModeSchema = z.enum(["gross", "net"]);
export const holeCountSchema = z.union([z.literal(9), z.literal(18)]);

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

export const gameConfigSchema = z.object({
  scoringMode: scoringModeSchema,
  stakePerSkinCents: z.number().int().positive("Stake must be greater than zero"),
  carryoversEnabled: z.boolean(),
});

export const roundSetupSchema = z.object({
  name: z.string().trim().min(1, "Round name is required"),
  courseName: z.string().trim().min(1, "Course name is required"),
  holeCount: holeCountSchema,
});

export const appSettingsSchema = z.object({
  defaultScoringMode: scoringModeSchema,
  defaultStakePerSkinCents: z.number().int().positive(),
  defaultCarryoversEnabled: z.boolean(),
  currency: currencyCodeSchema,
});

export const playerHoleScoreSchema = z.object({
  playerId: z.string(),
  holeNumber: z.number().int().positive(),
  grossScore: z.number().int().positive().nullable(),
});

export const skinResultSchema = z.object({
  holeNumber: z.number().int().positive(),
  winnerPlayerId: z.string().nullable(),
  tiedPlayerIds: z.array(z.string()),
  skinsWon: z.number().int().nonnegative(),
  monetaryValueCents: z.number().int().nonnegative(),
  carriedIntoNextHoleCents: z.number().int().nonnegative(),
});

export const roundSchema = z.object({
  id: z.string(),
  name: z.string(),
  courseName: z.string(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  holeCount: holeCountSchema,
  currentHole: z.number().int().positive(),
  status: z.enum(["setup", "active", "completed"]),
  scoringMode: scoringModeSchema,
  stakePerSkinCents: z.number().int().positive(),
  carryoversEnabled: z.boolean(),
  currency: currencyCodeSchema,
  players: z.array(playerSchema),
  holes: z.array(holeSchema),
  scores: z.array(playerHoleScoreSchema),
  skinResults: z.array(skinResultSchema),
});

export const persistedStateSchema = z.object({
  activeRound: roundSchema.nullable(),
  roundHistory: z.array(roundSchema),
  settings: appSettingsSchema,
});

export type PersistedState = z.infer<typeof persistedStateSchema>;
