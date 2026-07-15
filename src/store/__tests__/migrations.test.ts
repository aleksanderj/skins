import { migratePersistedState, CURRENT_SCHEMA_VERSION } from "../migrations";
import { persistedStateSchema } from "../../validation/schemas";
import { makeMatchPlayRound, makePlayers } from "../../test-utils/roundFactory";

const legacyV1Round = {
  id: "round_1",
  name: "Skins at Pine Valley",
  courseName: "Pine Valley",
  createdAt: "2025-01-01T00:00:00.000Z",
  completedAt: null,
  holeCount: 18,
  currentHole: 5,
  status: "active",
  scoringMode: "net",
  stakePerSkinCents: 500,
  carryoversEnabled: true,
  currency: "USD",
  players: [
    { id: "p1", name: "Alex", handicap: 8 },
    { id: "p2", name: "Ben", handicap: 14 },
  ],
  holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4 as const, strokeIndex: i + 1 })),
  scores: [{ playerId: "p1", holeNumber: 1, grossScore: 4 }],
  skinResults: [
    {
      holeNumber: 1,
      winnerPlayerId: "p1",
      tiedPlayerIds: [],
      skinsWon: 1,
      monetaryValueCents: 500,
      carriedIntoNextHoleCents: 0,
    },
  ],
};

const legacyV1Settings = {
  defaultScoringMode: "net",
  defaultStakePerSkinCents: 500,
  defaultCarryoversEnabled: true,
  currency: "USD",
};

describe("migratePersistedState", () => {
  it("migrates a legacy (pre-format) Skins round into the current shape", () => {
    const migrated = migratePersistedState({
      activeRound: legacyV1Round,
      roundHistory: [],
      settings: legacyV1Settings,
    }) as any;

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.activeRound.format).toBe("skins");
    expect(migrated.activeRound.skinsConfig).toEqual({
      scoringMode: "net",
      stakePerSkinCents: 500,
      carryoversEnabled: true,
    });
    expect(migrated.activeRound.skinsResult.skinResults).toHaveLength(1);
    // legacy flat fields should not survive on the migrated round
    expect(migrated.activeRound.scoringMode).toBeUndefined();
    expect(migrated.activeRound.stakePerSkinCents).toBeUndefined();
  });

  it("migrated Skins state passes full schema validation", () => {
    const migrated = migratePersistedState({
      activeRound: legacyV1Round,
      roundHistory: [legacyV1Round],
      settings: legacyV1Settings,
    });
    const result = persistedStateSchema.safeParse(migrated);
    expect(result.success).toBe(true);
  });

  it("migrates legacy flat settings into grouped Skins/Match Play defaults", () => {
    const migrated = migratePersistedState({
      activeRound: null,
      roundHistory: [],
      settings: legacyV1Settings,
    }) as any;
    expect(migrated.settings.skinsDefaults).toEqual({
      scoringMode: "net",
      stakePerSkinCents: 500,
      carryoversEnabled: true,
    });
    expect(migrated.settings.matchPlayDefaults).toBeDefined();
    expect(migrated.settings.currency).toBe("USD");
  });

  it("is a no-op on already-current-shape state", () => {
    const players = makePlayers(2);
    const matchPlayRound = makeMatchPlayRound({ players });
    const currentState = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      activeRound: matchPlayRound,
      roundHistory: [],
      settings: {
        skinsDefaults: { scoringMode: "net", stakePerSkinCents: 500, carryoversEnabled: true },
        matchPlayDefaults: {
          mode: "individual",
          scoringMode: "net",
          handicapAllowancePercent: 100,
          structure: "single_match",
          stakeCents: 2000,
          tieRule: "halve",
        },
        currency: "USD",
      },
    };
    expect(migratePersistedState(currentState)).toEqual(currentState);
  });

  it("persists and restores a Match Play round, including active playoff scores", () => {
    const players = makePlayers(2);
    const matchPlayRound = makeMatchPlayRound({
      players,
      matchPlayTieRule: "playoff",
      matchPlayPlayoffScores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 5 },
      ],
    });
    const state = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      activeRound: matchPlayRound,
      roundHistory: [],
      settings: {
        skinsDefaults: { scoringMode: "net", stakePerSkinCents: 500, carryoversEnabled: true },
        matchPlayDefaults: {
          mode: "individual",
          scoringMode: "net",
          handicapAllowancePercent: 100,
          structure: "single_match",
          stakeCents: 2000,
          tieRule: "halve",
        },
        currency: "USD",
      },
    };

    const result = persistedStateSchema.safeParse(state);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeRound?.matchPlayPlayoffScores).toHaveLength(2);
    }
  });

  it("fails validation safely on corrupted Match Play state instead of throwing", () => {
    const players = makePlayers(2);
    const corruptRound = {
      ...makeMatchPlayRound({ players }),
      matchPlayConfig: { mode: "individual" }, // missing required fields
    };
    const state = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      activeRound: corruptRound,
      roundHistory: [],
      settings: {
        skinsDefaults: { scoringMode: "net", stakePerSkinCents: 500, carryoversEnabled: true },
        matchPlayDefaults: {
          mode: "individual",
          scoringMode: "net",
          handicapAllowancePercent: 100,
          structure: "single_match",
          stakeCents: 2000,
          tieRule: "halve",
        },
        currency: "USD",
      },
    };

    expect(() => persistedStateSchema.safeParse(state)).not.toThrow();
    expect(persistedStateSchema.safeParse(state).success).toBe(false);
  });

  it("returns non-object input unchanged rather than throwing", () => {
    expect(migratePersistedState(null)).toBeNull();
    expect(migratePersistedState(undefined)).toBeUndefined();
    expect(migratePersistedState("garbage")).toBe("garbage");
  });
});
