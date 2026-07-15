export const CURRENT_SCHEMA_VERSION = 2 as const;

const DEFAULT_MATCH_PLAY_DEFAULTS = {
  mode: "individual" as const,
  scoringMode: "net" as const,
  handicapAllowancePercent: 100 as const,
  structure: "single_match" as const,
  stakeCents: 2000,
  tieRule: "halve" as const,
};

/**
 * Migrates a v1 (pre-format) round into the current shape: adds
 * `format: "skins"` and folds the old flat Skins fields into `skinsConfig`
 * / `skinsResult`. Rounds that already have a `format` are left untouched.
 */
function migrateRound(round: unknown): unknown {
  if (round === null || typeof round !== "object") return round;
  const r = round as Record<string, unknown>;
  if (typeof r.format === "string") return round; // already current-shape

  const { scoringMode, stakePerSkinCents, carryoversEnabled, skinResults, ...rest } = r;

  return {
    ...rest,
    format: "skins",
    skinsConfig: {
      scoringMode: scoringMode ?? "net",
      stakePerSkinCents: typeof stakePerSkinCents === "number" ? stakePerSkinCents : 500,
      carryoversEnabled: carryoversEnabled ?? true,
    },
    skinsResult: {
      skinResults: Array.isArray(skinResults) ? skinResults : [],
    },
  };
}

function migrateSettings(settings: unknown): unknown {
  if (settings === null || typeof settings !== "object") {
    return {
      skinsDefaults: { scoringMode: "net", stakePerSkinCents: 500, carryoversEnabled: true },
      matchPlayDefaults: DEFAULT_MATCH_PLAY_DEFAULTS,
      currency: "USD",
    };
  }

  const s = settings as Record<string, unknown>;
  if (s.skinsDefaults && s.matchPlayDefaults) return settings; // already current-shape

  return {
    skinsDefaults: {
      scoringMode: s.defaultScoringMode ?? "net",
      stakePerSkinCents: typeof s.defaultStakePerSkinCents === "number" ? s.defaultStakePerSkinCents : 500,
      carryoversEnabled: s.defaultCarryoversEnabled ?? true,
    },
    matchPlayDefaults: DEFAULT_MATCH_PLAY_DEFAULTS,
    currency: s.currency ?? "USD",
  };
}

/**
 * Brings persisted state up to the current schema version. Safe to call on
 * already-current state (each step is a no-op if the shape is already
 * there) and safe to call on garbage input — it never throws, since the
 * caller runs the result through Zod validation afterward and treats a
 * validation failure as corrupt data to discard.
 */
export function migratePersistedState(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object") return raw;
  const state = raw as Record<string, unknown>;

  if (state.schemaVersion === CURRENT_SCHEMA_VERSION) return state;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeRound: migrateRound(state.activeRound ?? null),
    roundHistory: Array.isArray(state.roundHistory) ? state.roundHistory.map(migrateRound) : [],
    settings: migrateSettings(state.settings),
  };
}
