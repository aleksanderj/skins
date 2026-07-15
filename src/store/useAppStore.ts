import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildDemoRoundInput,
  buildIndividualMatchPlayDemoInput,
  buildTeamNassauDemoInput,
} from "../features/rounds/demoRound";
import { recalculateRoundResult } from "../features/rounds/recalculate";
import type { CreateRoundInput } from "../features/rounds/types";
import { CURRENT_SCHEMA_VERSION, validatedAsyncStorage } from "./persistenceStorage";
import type {
  AppSettings,
  GameFormat,
  HandicapAllowancePercent,
  MatchPlayMode,
  MatchPlayStructure,
  MatchPlayTeam,
  MatchPlayTieRule,
  Player,
  Round,
  ScoringMode,
} from "../types";
import { generateId } from "../utils/id";

const DEFAULT_SETTINGS: AppSettings = {
  skinsDefaults: {
    scoringMode: "net",
    stakePerSkinCents: 500,
    carryoversEnabled: true,
  },
  matchPlayDefaults: {
    mode: "individual",
    scoringMode: "net",
    handicapAllowancePercent: 100,
    structure: "single_match",
    stakeCents: 2000,
    tieRule: "halve",
  },
  currency: "USD",
};

function buildTeamsFromInput(input: CreateRoundInput, players: Player[]): MatchPlayTeam[] | undefined {
  if (input.matchPlayMode !== "team") return undefined;
  const assignments = input.teamAssignments ?? players.map((_, i) => ({ teamIndex: (i < 2 ? 0 : 1) as 0 | 1 }));
  const teamNames = input.teamNames ?? ["Team A", "Team B"];

  const teamAIds = players.filter((_, i) => assignments[i]?.teamIndex === 0).map((p) => p.id);
  const teamBIds = players.filter((_, i) => assignments[i]?.teamIndex === 1).map((p) => p.id);

  return [
    { id: generateId("team"), name: teamNames[0], playerIds: teamAIds },
    { id: generateId("team"), name: teamNames[1], playerIds: teamBIds },
  ];
}

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
  loadIndividualMatchPlayDemo: () => void;
  loadTeamNassauDemo: () => void;
  setHasHydrated: (value: boolean) => void;

  // Match Play
  setGameFormat: (format: GameFormat) => void;
  setMatchPlayMode: (mode: MatchPlayMode) => void;
  setMatchPlayScoringMode: (scoringMode: ScoringMode) => void;
  setMatchPlayHandicapAllowance: (percent: HandicapAllowancePercent) => void;
  setMatchPlayStructure: (structure: MatchPlayStructure) => void;
  setMatchPlayStake: (stakeCents: number) => void;
  setMatchPlayTieRule: (tieRule: MatchPlayTieRule) => void;
  assignPlayerToTeam: (playerId: string, teamId: string) => void;
  renameTeam: (teamId: string, name: string) => void;
  submitMatchPlayHole: (holeNumber: number) => void;
  startMatchPlayPlayoff: () => void;
  setPlayoffHoleScore: (playerId: string, playoffHoleNumber: number, grossScore: number | null) => void;
  submitPlayoffHole: () => void;
  recalculateMatchPlayRound: () => void;
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

        const defaultName =
          input.format === "skins" ? `Skins at ${input.courseName}` : `Match Play at ${input.courseName}`;

        const base = {
          id: generateId("round"),
          name: input.name.trim() || defaultName,
          courseName: input.courseName.trim(),
          createdAt: new Date().toISOString(),
          completedAt: null,
          holeCount: input.holeCount,
          currentHole: 1,
          status: "active" as const,
          format: input.format,
          currency: input.currency,
          players,
          holes: input.holes,
          scores: [],
        };

        let round: Round;
        if (input.format === "skins") {
          round = {
            ...base,
            skinsConfig: {
              scoringMode: input.scoringMode ?? "gross",
              stakePerSkinCents: input.stakePerSkinCents ?? 100,
              carryoversEnabled: input.carryoversEnabled ?? false,
            },
          };
        } else {
          round = {
            ...base,
            matchPlayConfig: {
              mode: input.matchPlayMode ?? "individual",
              scoringMode: input.matchPlayScoringMode ?? "net",
              handicapAllowancePercent: input.handicapAllowancePercent ?? 100,
              stakeCents: input.matchPlayStakeCents ?? 100,
              tieRule: input.matchPlayTieRule ?? "halve",
              structure: input.matchPlayStructure ?? "single_match",
              teams: buildTeamsFromInput(input, players),
            },
            matchPlayPlayoffScores: [],
          };
        }

        set({ activeRound: recalculateRoundResult(round) });
      },

      updateRound: (updates) => {
        const round = get().activeRound;
        if (!round) return;
        set({ activeRound: recalculateRoundResult({ ...round, ...updates }) });
      },

      addPlayer: (player) => {
        const round = get().activeRound;
        if (!round) return;
        const newPlayer: Player = { id: generateId("player"), name: player.name.trim(), handicap: player.handicap };
        set({
          activeRound: recalculateRoundResult({ ...round, players: [...round.players, newPlayer] }),
        });
      },

      removePlayer: (playerId) => {
        const round = get().activeRound;
        if (!round) return;
        const matchPlayConfig = round.matchPlayConfig
          ? {
              ...round.matchPlayConfig,
              teams: round.matchPlayConfig.teams?.map((t) => ({
                ...t,
                playerIds: t.playerIds.filter((id) => id !== playerId),
              })),
            }
          : undefined;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            players: round.players.filter((p) => p.id !== playerId),
            scores: round.scores.filter((s) => s.playerId !== playerId),
            ...(matchPlayConfig ? { matchPlayConfig } : {}),
          }),
        });
      },

      updatePlayer: (playerId, updates) => {
        const round = get().activeRound;
        if (!round) return;
        set({
          activeRound: recalculateRoundResult({
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

        set({ activeRound: recalculateRoundResult({ ...round, scores }) });
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
        set({ activeRound: recalculateRoundResult(round) });
      },

      completeRound: () => {
        const round = get().activeRound;
        if (!round) return;
        const finalRound = recalculateRoundResult({
          ...round,
          status: "completed",
          completedAt: new Date().toISOString(),
        });
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

      loadIndividualMatchPlayDemo: () => {
        get().createRound(buildIndividualMatchPlayDemoInput());
      },

      loadTeamNassauDemo: () => {
        get().createRound(buildTeamNassauDemoInput());
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),

      // -----------------------------------------------------------------
      // Match Play
      // -----------------------------------------------------------------

      setGameFormat: (format) => {
        const round = get().activeRound;
        if (!round) return;
        set({ activeRound: recalculateRoundResult({ ...round, format }) });
      },

      setMatchPlayMode: (mode) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, mode },
          }),
        });
      },

      setMatchPlayScoringMode: (scoringMode) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, scoringMode },
          }),
        });
      },

      setMatchPlayHandicapAllowance: (percent) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, handicapAllowancePercent: percent },
          }),
        });
      },

      setMatchPlayStructure: (structure) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, structure },
          }),
        });
      },

      setMatchPlayStake: (stakeCents) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, stakeCents },
          }),
        });
      },

      setMatchPlayTieRule: (tieRule) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, tieRule },
          }),
        });
      },

      assignPlayerToTeam: (playerId, teamId) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig?.teams) return;
        const teams = round.matchPlayConfig.teams.map((t) => ({
          ...t,
          playerIds:
            t.id === teamId
              ? [...t.playerIds.filter((id) => id !== playerId), playerId]
              : t.playerIds.filter((id) => id !== playerId),
        }));
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayConfig: { ...round.matchPlayConfig, teams },
          }),
        });
      },

      renameTeam: (teamId, name) => {
        const round = get().activeRound;
        if (!round?.matchPlayConfig?.teams) return;
        const teams = round.matchPlayConfig.teams.map((t) => (t.id === teamId ? { ...t, name } : t));
        set({ activeRound: { ...round, matchPlayConfig: { ...round.matchPlayConfig, teams } } });
      },

      submitMatchPlayHole: (holeNumber) => {
        get().submitHole(holeNumber);
      },

      startMatchPlayPlayoff: () => {
        const round = get().activeRound;
        if (!round) return;
        set({
          activeRound: recalculateRoundResult({
            ...round,
            matchPlayPlayoffScores: round.matchPlayPlayoffScores ?? [],
          }),
        });
      },

      setPlayoffHoleScore: (playerId, playoffHoleNumber, grossScore) => {
        const round = get().activeRound;
        if (!round) return;
        const playoffScores = round.matchPlayPlayoffScores ?? [];
        const existingIndex = playoffScores.findIndex(
          (s) => s.playerId === playerId && s.holeNumber === playoffHoleNumber
        );
        const nextScores = [...playoffScores];
        if (existingIndex >= 0) {
          nextScores[existingIndex] = { playerId, holeNumber: playoffHoleNumber, grossScore };
        } else {
          nextScores.push({ playerId, holeNumber: playoffHoleNumber, grossScore });
        }
        set({ activeRound: recalculateRoundResult({ ...round, matchPlayPlayoffScores: nextScores }) });
      },

      submitPlayoffHole: () => {
        const round = get().activeRound;
        if (!round) return;
        set({ activeRound: recalculateRoundResult(round) });
      },

      recalculateMatchPlayRound: () => {
        get().recalculateRound();
      },
    }),
    {
      name: "skins-app-storage",
      storage: createJSONStorage(() => validatedAsyncStorage),
      partialize: (state) => ({
        schemaVersion: CURRENT_SCHEMA_VERSION,
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
