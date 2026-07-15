import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";
import { persistedStateSchema } from "../validation/schemas";
import { migratePersistedState, CURRENT_SCHEMA_VERSION } from "./migrations";

/**
 * Tracks whether the most recent hydration attempt discarded corrupt data,
 * so the UI can show a one-time, non-blocking notice instead of crashing
 * or silently losing the user's rounds without explanation.
 */
let lastHydrationWasReset = false;

export function didResetCorruptData(): boolean {
  return lastHydrationWasReset;
}

export function acknowledgeCorruptDataReset(): void {
  lastHydrationWasReset = false;
}

/**
 * Validates persisted JSON against the app's Zod schema before handing it
 * to zustand's persist middleware. Legacy (pre-schemaVersion) state is
 * migrated forward first. Invalid or corrupted data — before or after
 * migration — is treated as "no saved state" rather than thrown, so the
 * app always boots cleanly.
 */
export const validatedAsyncStorage: StateStorage = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;

    try {
      const envelope = JSON.parse(raw);
      const migratedState = migratePersistedState(envelope.state);
      const result = persistedStateSchema.safeParse(migratedState);
      if (!result.success) {
        lastHydrationWasReset = true;
        return null;
      }
      return JSON.stringify({ ...envelope, state: migratedState });
    } catch {
      lastHydrationWasReset = true;
      return null;
    }
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export { CURRENT_SCHEMA_VERSION };
