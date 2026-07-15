# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Skins — a local-only, mobile-first Expo/React Native app for running a golf Skins game: create a round, add 2–4 players, enter scores hole by hole, watch live balances and carryovers, and get an optimized settlement ("who pays whom") at the end. No backend, no auth, no payment processing — the app only calculates results. See README.md for the full product/feature rundown and known limitations.

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

There are 41 unit tests, all in `src/utils/__tests__/`, covering the game-logic utilities. Run `npm test` after touching anything in `src/utils/`.

## Architecture

**`app/` is routing only — no business logic.** Every screen is a thin composition of `src/components` + `src/features` pieces, reading/writing state via `useAppStore`. All scoring, balance, and settlement math lives in `src/utils/` as pure, independently-tested functions. When changing game rules, start in `src/utils/`, not in a screen.

### Route structure (Expo Router, file-based)

```
app/_layout.tsx                 root Stack: (tabs) group + the round flow
app/(tabs)/                     bottom tab navigator — Home, History, Settings
  index.tsx                      Home
  history/                       its own nested Stack (list + read-only detail)
  settings.tsx
app/create-round.tsx            modal: round setup form
app/round/[roundId]/            the active-round flow, deliberately outside the tab bar
  index.tsx                       hole-by-hole score entry (Round Overview)
  leaderboard.tsx                  live Balances / Skins views
  review.tsx                       full scorecard, edit-any-hole, Complete Round
  settlement.tsx                    winner card, settlement, share, final balances
```

`(tabs)` is a route group required to get a real bottom tab bar with Expo Router — this is a deliberate deviation from the flatter tree suggested in the original product spec (documented in README.md under "Route structure note"). Don't flatten it back out; Home/History/Settings must stay under `(tabs)` or the tab bar breaks.

### State: one Zustand store, everything derived from scores

`src/store/useAppStore.ts` holds `activeRound`, `roundHistory`, and `settings`, persisted to `AsyncStorage` via zustand's `persist` middleware. Key invariant: **`Round.scores` is the only source of truth for game results.** `Round.skinResults` is a cached derived value — every store action that touches scores or round config (`setHoleScore`, `updatePlayer`, `removePlayer`, `updateRound`) calls `recalculateSkinResults` (`src/features/rounds/recalculate.ts`) afterward, which re-runs `calculateSkinResults` from scratch. Editing a past hole's score therefore transparently recalculates every later result and balance — never hand-patch `skinResults` or a balance directly.

`src/store/persistenceStorage.ts` wraps `AsyncStorage` with a Zod validation pass (`src/validation/schemas.ts`) before zustand hydrates from it. Invalid/corrupt persisted JSON is discarded (treated as "no saved state") rather than thrown — `didResetCorruptData()` flags this for a one-time banner in `app/_layout.tsx`. Keep this validate-before-hydrate pattern if the persisted shape changes.

### Game logic (`src/utils/`)

All money is **integer cents** end to end (`stakePerSkinCents`, `balanceCents`, `amountCents`, ...) — never floats — converted to a display string only via `formatCurrency`/`formatSignedCurrency` (`currency.ts`, `Intl.NumberFormat`-based). `calculateSkinResults` (`skins.ts`) walks holes in order and **stops at the first hole missing a complete set of scores**, so it's safe to call on a partially-entered round. Carryover accumulation, tie handling, and the final-hole-unresolved-carryover case all live there — see the tests in `skins.test.ts` for the exact expected behavior before changing it.

There's no real course/slope handicap model — `calculatePlayingHandicap` (`handicap.ts`) is `Math.round(handicap)`, halved again for 9-hole rounds, then `getHandicapStrokesForHole` allocates strokes by stroke index using the standard `floor(hcp/holes)` + hardest-`hcp%holes`-holes-get-one-more method. This is an intentional MVP simplification, documented inline and in README.md — don't "fix" it into a real slope-rating system without discussing scope first.

Balances (`balances.ts`) use a "loser pays winner per skin" model: each skin win transfers `stakePerSkinCents` from every *other* player to the winner (so total balances are always zero-sum). Settlements (`settlements.ts`) are a **greedy** largest-debtor/largest-creditor match — deterministic and near-minimal, not a true minimum-transaction solver (see README.md limitations).

### Validation

Zod schemas in `src/validation/schemas.ts` serve two purposes: form validation in `app/create-round.tsx` (round setup, players, game config, course/holes) and persisted-data integrity on hydration. If you add a field to `Round`/`Player`/`Hole`/etc. in `src/types/`, update the matching schema too, since the persistence layer will otherwise reject previously-valid data.

### Components vs. features

`src/components/` holds generic, context-free UI primitives (buttons, cards, `MoneyAmount`, `BalanceBadge`, `ScoreStepper`, etc.) — these must never import from `src/features` or `src/store`. Composite pieces that are specific to one part of the product (stake preset picker, player-form row, course-setup table, round summary card) live under `src/features/<area>/` next to the screens that use them. `src/features/rounds/selectors.ts` is the read layer over a `Round` (balances, leader, completed-hole count, unresolved carryover, etc.) — prefer adding a selector there over recomputing derived round data inline in a screen.

Balance/win-loss UI never relies on color alone — it pairs color with an explicit sign and an icon (see `MoneyAmount`, `BalanceBadge`). Keep that pattern for any new financial-status UI.
