# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Skins — a local-only, mobile-first Expo/React Native app for running golf **Skins** or **Match Play** games: create a round, add players, enter scores hole by hole, watch live balances/match status, and get an optimized settlement ("who pays whom") at the end. No backend, no auth, no payment processing — the app only calculates results. See README.md for the full product/feature rundown and known limitations.

## Commands

```bash
npm install
npm start            # Expo dev tools; scan the QR / open in Expo Go
npm run ios          # or: npm run android / npm run web

npm test             # run the full Jest suite once
npm run test:watch   # watch mode
npx jest path/to/file.test.ts        # single test file
npx jest -t "name of test"           # single test by name

npx tsc --noEmit      # typecheck (no dedicated lint script is configured)
```

There are 118 unit tests: `src/utils/__tests__/` (Skins + shared), `src/utils/matchPlay/__tests__/` (Match Play), `src/store/__tests__/` (persistence migration). Run `npm test` after touching anything in `src/utils/` or `src/store/migrations.ts`.

## Architecture

**`app/` is routing only — no business logic.** Every screen is a thin composition of `src/components` + `src/features` pieces, reading/writing state via `useAppStore`. All scoring, balance, and settlement math lives in `src/utils/` as pure, independently-tested functions. When changing game rules, start in `src/utils/`, not in a screen.

### Route structure (Expo Router, file-based)

```
app/_layout.tsx                 root Stack: (tabs) group + the round flow
app/(tabs)/                     bottom tab navigator — Home, History, Settings
  index.tsx                      Home
  history/                       its own nested Stack (list with format filter + read-only detail)
  settings.tsx                    grouped Skins Defaults / Match Play Defaults / General
app/create-round.tsx            modal: format selection + format-specific setup form
app/round/[roundId]/            the active-round flow, deliberately outside the tab bar
  index.tsx                       hole-by-hole scoring — branches by round.format, plus the
                                   sudden-death playoff flow (see below)
  leaderboard.tsx                  Skins: Balances/Skins views. Match Play: Match/Scorecard/Balances
  review.tsx                       full scorecard, edit-any-hole, match/Nassau/playoff summary
  settlement.tsx                    winner or match-result card, settlement, share, final balances
```

`(tabs)` is a route group required to get a real bottom tab bar with Expo Router — a deliberate deviation from the flatter tree suggested in the original product spec (documented in README.md under "Route structure note"). Don't flatten it back out.

### State: one Zustand store, everything derived from scores

`src/store/useAppStore.ts` holds `activeRound`, `roundHistory`, and `settings`, persisted to `AsyncStorage` via zustand's `persist` middleware. Key invariant: **`Round.scores` (and `matchPlayPlayoffScores` for playoffs) is the only source of truth for game results.** `Round.skinsResult` / `Round.matchPlayResult` are cached derived values — every store action that touches scores or round config calls `recalculateRoundResult` (`src/features/rounds/recalculate.ts`), which dispatches to `calculateSkinResults` or `calculateMatchPlayRoundResult` based on `round.format`. Editing a past hole's score therefore transparently recalculates every later result and balance — never hand-patch a cached result or a balance directly.

`src/store/persistenceStorage.ts` wraps `AsyncStorage` with a migration pass (`src/store/migrations.ts`) followed by Zod validation (`src/validation/schemas.ts`) before zustand hydrates. Persisted state carries a `schemaVersion`; `migratePersistedState` upgrades legacy (pre-Match-Play) rounds and settings to the current shape before validation runs. Invalid/corrupt persisted JSON — before or after migration — is discarded (treated as "no saved state") rather than thrown — `didResetCorruptData()` flags this for a one-time banner in `app/_layout.tsx`. **If you change the persisted shape again, add a migration step, don't just bump types** — there are real users' rounds in `AsyncStorage` this has to keep loading.

### Round is one type, two formats

`Round.format: "skins" | "match_play"` discriminates which optional sub-object is populated: `skinsConfig`/`skinsResult` or `matchPlayConfig`/`matchPlayResult`/`matchPlayPlayoffScores`. Format-specific fields are never flattened onto the base `Round` — see `src/types/index.ts`. Shared fields (`players`, `holes`, `scores`, `currency`, `holeCount`, ...) work identically across both formats.

### Game logic (`src/utils/`)

All money is **integer cents** end to end — never floats — converted to a display string only via `formatCurrency`/`formatSignedCurrency` (`currency.ts`). There's no real course/slope handicap model in either format — `calculatePlayingHandicap` (`handicap.ts`) is `Math.round(handicap)`, halved again for 9-hole rounds; this is an intentional MVP simplification, don't "fix" it without discussing scope first.

**Skins** (`skins.ts`, `balances.ts`): `calculateSkinResults` walks holes in order and stops at the first hole missing a complete set of scores. Balances use a "loser pays winner per skin" model (zero-sum by construction).

**Match Play** (`src/utils/matchPlay/`): Individual (2 players) and Team (4 players, 2v2) modes are unified by normalizing both into two generic **sides** (`getMatchPlaySides` in `sides.ts`) — an individual side just wraps one player. Every hole/status/result function is written once against "side A vs. side B"; team scoring only special-cases at the lowest level (`calculateTeamMatchPlayHole` reduces each side's raw member scores to best-ball before the same comparison individual mode uses). `calculateMatchPlayRoundResult` (`round.ts`) is the per-round orchestrator, called by `recalculateRoundResult` exactly like `calculateSkinResults` is for Skins.

Two non-obvious things worth knowing before touching this code:

1. **Once a match is `isMatchComplete`, its official result is frozen** at the deciding hole (`calculateMatchPlayResult` in `result.ts`). Later holes can still be entered ("Continue Scoring for Scorecard") and are recorded, but never change `winnerSideId`/`completionHole`/`resultLabel`.
2. **Entering sudden-death playoff mode is a user-triggered UI transition, not a derived one.** `app/round/[roundId]/index.tsx` used to compute "show the playoff screen" reactively from `round.matchPlayResult`, which swapped the screen out from under the user the instant the last regulation score was entered — before they ever saw the "Hole 18 Halved" result panel. It's now gated behind an explicit "Start Playoff" button and a locally-buffered `displayedPlayoffHole`/`playoffModeEntered` state, mirroring the same buffering pattern the regulation flow already used for `displayedHole`. If you touch this screen, keep screen-navigation decisions driven by explicit user actions, not live-recalculated round state — pure unit tests can't catch this class of bug, only running the app can.

Also: a Nassau segment's deciding hole is recorded with the round's *absolute* hole number (e.g. 14, for the back nine's 5th hole), while the segment's own `holeCount` is 9 — `formatMatchPlayResult` must use the hole result's own (already segment-relative) `holesRemaining` field, never `holeCount - completionHole`, or segment labels come out as nonsense like `"5 & -5"` (see the regression test in `nassau.test.ts`).

Settlements (`settlements.ts`) are a shared **greedy** largest-debtor/largest-creditor match, reused by both formats — deterministic and near-minimal, not a true minimum-transaction solver.

### Validation

Zod schemas in `src/validation/schemas.ts` serve form validation (`app/create-round.tsx`) and persisted-data integrity on hydration. `roundSchema` is a discriminated union on `format`. If you add a field to `Round`/`MatchPlayConfig`/etc. in `src/types/`, update the matching schema too, or the persistence layer will reject previously-valid data — and consider whether a migration step is needed (see above).

### Components vs. features

`src/components/` holds generic, context-free UI primitives — these must never import from `src/features` or `src/store`. Composite pieces specific to one part of the product (stake selector, player-form row, Match Play settings section, team-assignment section, round summary card) live under `src/features/<area>/`. `src/features/rounds/selectors.ts` is the read layer over a `Round` (balances, leader, match status headline, completed-hole count, etc.) and is format-aware internally — screens call `getPlayerBalances(round)` etc. without needing to branch on format themselves. Prefer adding a selector there over recomputing derived round data inline in a screen.

Balance/win-loss UI never relies on color alone — it pairs color with an explicit sign and an icon (see `MoneyAmount`, `BalanceBadge`). Keep that pattern for any new financial-status UI.
