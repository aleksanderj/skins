import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildDemoRoundInput } from "../features/rounds/demoRound";
import { recalculateSkinResults } from "../features/rounds/recalculate";
import type { CreateRoundInput } from "../features/rounds/types";
import { validatedAsyncStorage } from "./persistenceStorage";
import type { AppSettings, Player, Round } from "../types";
import { calculateSkinResults } from "../utils/skins";
import { generateId } from "../utils/id";

const DEFAULT_SETTINGS: AppSettings = {
  defaultScoringMode: "net",
  defaultStakePerSkinCents: 500,
  defaultCarryoversEnabled: true,
  currency: "USD",
};

type AppState = {
  activeRound: Round | null;
  roundHistory: Round[];
  settings: AppSettings;
  hasHydrated: boolean;

  createRound: (input: CreateRoundInput) => void;
  updateRound: (updates: Partial<Round>) => void;
  addPlayer: (player: { name: string; handicap: number }) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Pick<Player, "name" | "handicap">>) => void;
  setHoleScore: (playerId: string, holeNumber: number, grossScore: number | null) => void;
  submitHole: (holeNumber: number) => void;
  recalculateRound: () => void;
  completeRound: () => void;
  deleteRound: (roundId: string) => void;
  abandonRound: () => void;
  resetAppData: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  loadDemoRound: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeRound: null,
      roundHistory: [],
      settings: DEFAULT_SETTINGS,
      hasHydrated: false,

      createRound: (input) => {
        const players: Player[] = input.players.map((p) => ({
          id: generateId("player"),
          name: p.name.trim(),
          handicap: p.handicap,
        }));

        const round: Round = {
          id: generateId("round"),
          name: input.name.trim() || `Skins at ${input.courseName}`,
          courseName: input.courseName.trim(),
          createdAt: new Date().toISOString(),
          completedAt: null,
          holeCount: input.holeCount,
          currentHole: 1,
          status: "active",
          scoringMode: input.scoringMode,
          stakePerSkinCents: input.stakePerSkinCents,
          carryoversEnabled: input.carryoversEnabled,
          currency: input.currency,
          players,
          holes: input.holes,
          scores: [],
          skinResults: [],
        };

        set({ activeRound: round });
      },

      updateRound: (updates) => {
        const round = get().activeRound;
        if (!round) return;
        const updated = recalculateSkinResults({ ...round, ...updates });
        set({ activeRound: updated });
      },

      addPlayer: (player) => {
        const round = get().activeRound;
        if (!round) return;
        const newPlayer: Player = { id: generateId("player"), name: player.name.trim(), handicap: player.handicap };
        set({
          activeRound: recalculateSkinResults({ ...round, players: [...round.players, newPlayer] }),
        });
      },

      removePlayer: (playerId) => {
        const round = get().activeRound;
        if (!round) return;
        set({
          activeRound: recalculateSkinResults({
            ...round,
            players: round.players.filter((p) => p.id !== playerId),
            scores: round.scores.filter((s) => s.playerId !== playerId),
          }),
        });
      },

      updatePlayer: (playerId, updates) => {
        const round = get().activeRound;
        if (!round) return;
        set({
          activeRound: recalculateSkinResults({
            ...round,
            players: round.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
          }),
        });
      },

      setHoleScore: (playerId, holeNumber, grossScore) => {
        const round = get().activeRound;
        if (!round) return;

        const existingIndex = round.scores.findIndex(
          (s) => s.playerId === playerId && s.holeNumber === holeNumber
        );
        const scores = [...round.scores];
        if (existingIndex >= 0) {
          scores[existingIndex] = { playerId, holeNumber, grossScore };
        } else {
          scores.push({ playerId, holeNumber, grossScore });
        }

        set({ activeRound: recalculateSkinResults({ ...round, scores }) });
      },

      submitHole: (holeNumber) => {
        const round = get().activeRound;
        if (!round) return;
        // Never regress currentHole — this also gets called when re-submitting an
        // already-completed hole from the Review screen's edit flow.
        const nextHole = Math.max(round.currentHole, Math.min(holeNumber + 1, round.holeCount));
        set({ activeRound: { ...round, currentHole: nextHole } });
      },

      recalculateRound: () => {
        const round = get().activeRound;
        if (!round) return;
        set({ activeRound: recalculateSkinResults(round) });
      },

      completeRound: () => {
        const round = get().activeRound;
        if (!round) return;
        const finalRound: Round = {
          ...round,
          status: "completed",
          completedAt: new Date().toISOString(),
          skinResults: calculateSkinResults(round),
        };
        set((state) => ({
          activeRound: null,
          roundHistory: [finalRound, ...state.roundHistory],
        }));
      },

      deleteRound: (roundId) => {
        set((state) => ({
          roundHistory: state.roundHistory.filter((r) => r.id !== roundId),
        }));
      },

      abandonRound: () => {
        set({ activeRound: null });
      },

      resetAppData: () => {
        set({ activeRound: null, roundHistory: [], settings: DEFAULT_SETTINGS });
      },

      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },

      loadDemoRound: () => {
        get().createRound(buildDemoRoundInput());
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "skins-app-storage",
      storage: createJSONStorage(() => validatedAsyncStorage),
      partialize: (state) => ({
        activeRound: state.activeRound,
        roundHistory: state.roundHistory,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
