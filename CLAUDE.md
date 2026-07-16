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

There are 125 unit tests: `src/utils/__tests__/` (Skins + shared), `src/utils/matchPlay/__tests__/` (Match Play), `src/store/__tests__/` (persistence migration). Run `npm test` after touching anything in `src/utils/` or `src/store/migrations.ts`.

## Architecture

**`app/` is routing only — no business logic.** Every screen is a thin composition of `src/components` + `src/features` pieces, reading/writing state via `useAppStore`. All scoring, balance, and settlement math lives in `src/utils/` as pure, independently-tested functions. When changing game rules, start in `src/utils/`, not in a screen.

### Route structure (Expo Router, file-based)

```
app/_layout.tsx                 root Stack: (tabs) group + the round flow + global Toast mount
app/(tabs)/                     bottom tab navigator with a custom tabBar (AppTabBar) — Home,
                                 History, Settings, plus a center FAB that opens Create Round
  index.tsx                      Home
  history/                       its own nested Stack (list with format filter + read-only detail,
                                  including a full read-only ScorecardGrid)
  settings.tsx                    grouped Skins Defaults / Match Play Defaults / General
app/create-round.tsx            modal: format selection + format-specific setup form
app/round/[roundId]/            the active-round flow, deliberately outside the tab bar
  index.tsx                       hole-by-hole scoring — branches by round.format, a HoleNavigator
                                   shared back/forward control, one-tap submit (no confirmation
                                   step) with toast feedback, plus the sudden-death playoff flow
                                   (see below)
  leaderboard.tsx                  Skins: Balances/Skins views. Match Play: Match/Scorecard/Balances
                                   (Scorecard views on both formats share ScorecardGrid)
  review.tsx                       full scorecard (ScorecardGrid), edit-any-hole,
                                   match/Nassau/playoff summary
  settlement.tsx                    winner or match-result card, settlement, share, final balances
```

`(tabs)` is a route group required to get a real bottom tab bar with Expo Router — a deliberate deviation from the flatter tree suggested in the original product spec (documented in README.md under "Route structure note"). Don't flatten it back out. `AppTabBar` lays the row out as four flex slots (Home, History, an empty FAB slot, Settings) so the absolutely-positioned center FAB never overlaps a tab label — don't go back to centering it directly over the row.

### State: one Zustand store, everything derived from scores

`src/store/useAppStore.ts` holds `activeRound`, `roundHistory`, and `settings`, persisted to `AsyncStorage` via zustand's `persist` middleware. Key invariant: **`Round.scores` (and `matchPlayPlayoffScores` for playoffs) is the only source of truth for game results.** `Round.skinsResult` / `Round.matchPlayResult` are cached derived values — every store action that touches scores or round config calls `recalculateRoundResult` (`src/features/rounds/recalculate.ts`), which dispatches to `calculateSkinResults` or `calculateMatchPlayRoundResult` based on `round.format`. Editing a past hole's score therefore transparently recalculates every later result and balance — never hand-patch a cached result or a balance directly.

`src/store/useToastStore.ts` is a separate, tiny Zustand store (`{ toast, showToast(message), hideToast() }`) for one global toast banner, mounted once as `<Toast />` in `app/_layout.tsx`. Screens never render their own toast instances — call `showToast(message)` and the root-mounted component handles animation/dismissal. `Toast` slides up from the bottom (translateY + opacity, anchored above `insets.bottom`) and auto-dismisses after `VISIBLE_MS`; it does not persist and is unrelated to `useAppStore`.

`src/store/persistenceStorage.ts` wraps `AsyncStorage` with a migration pass (`src/store/migrations.ts`) followed by Zod validation (`src/validation/schemas.ts`) before zustand hydrates. Persisted state carries a `schemaVersion`; `migratePersistedState` upgrades legacy (pre-Match-Play) rounds and settings to the current shape before validation runs. Invalid/corrupt persisted JSON — before or after migration — is discarded (treated as "no saved state") rather than thrown — `didResetCorruptData()` flags this for a one-time banner in `app/_layout.tsx`. **If you change the persisted shape again, add a migration step, don't just bump types** — there are real users' rounds in `AsyncStorage` this has to keep loading.

### Round is one type, two formats

`Round.format: "skins" | "match_play"` discriminates which optional sub-object is populated: `skinsConfig`/`skinsResult` or `matchPlayConfig`/`matchPlayResult`/`matchPlayPlayoffScores`. Format-specific fields are never flattened onto the base `Round` — see `src/types/index.ts`. Shared fields (`players`, `holes`, `scores`, `currency`, `holeCount`, ...) work identically across both formats.

### Game logic (`src/utils/`)

All money is **integer cents** end to end — never floats — converted to a display string only via `formatCurrency`/`formatSignedCurrency` (`currency.ts`). There's no real course/slope handicap model in either format — `calculatePlayingHandicap` (`handicap.ts`) is `Math.round(handicap)`, halved again for 9-hole rounds; this is an intentional MVP simplification, don't "fix" it without discussing scope first.

**Skins** (`skins.ts`, `balances.ts`): `calculateSkinResults` walks holes in order and stops at the first hole missing a complete set of scores. Balances use a "loser pays winner per skin" model (zero-sum by construction).

**Match Play** (`src/utils/matchPlay/`): Individual (2 players) and Team (4 players, 2v2) modes are unified by normalizing both into two generic **sides** (`getMatchPlaySides` in `sides.ts`) — an individual side just wraps one player. Every hole/status/result function is written once against "side A vs. side B"; team scoring only special-cases at the lowest level (`calculateTeamMatchPlayHole` reduces each side's raw member scores to best-ball before the same comparison individual mode uses). `calculateMatchPlayRoundResult` (`round.ts`) is the per-round orchestrator, called by `recalculateRoundResult` exactly like `calculateSkinResults` is for Skins.

**`getScoreToParCategory(score, par)`** (`scoreToPar.ts`) is a small pure function shared by both formats' scorecards, returning one of `"albatross-or-better" | "eagle" | "birdie" | "par" | "bogey" | "double-bogey" | "triple-or-worse"` from `score - par`. It's always computed from the **gross** score (real golf convention), even when a scorecard is toggled to display net numbers — don't switch this to net when wiring up new scorecard UI.

Two non-obvious things worth knowing before touching this code:

1. **Once a match is `isMatchComplete`, its official result is frozen** at the deciding hole (`calculateMatchPlayResult` in `result.ts`). Later holes can still be entered ("Continue Scoring for Scorecard") and are recorded, but never change `winnerSideId`/`completionHole`/`resultLabel`.
2. **Entering sudden-death playoff mode is a user-triggered UI transition, not a derived one.** `app/round/[roundId]/index.tsx` used to compute "show the playoff screen" reactively from `round.matchPlayResult`, which swapped the screen out from under the user the instant the last regulation score was entered — before they ever saw the "Hole 18 Halved" result panel. It's now gated behind an explicit "Start Playoff" button and a locally-buffered `displayedPlayoffHole`/`playoffModeEntered` state, mirroring the same buffering pattern the regulation flow already used for `displayedHole`. If you touch this screen, keep screen-navigation decisions driven by explicit user actions, not live-recalculated round state — pure unit tests can't catch this class of bug, only running the app can.

Also: a Nassau segment's deciding hole is recorded with the round's *absolute* hole number (e.g. 14, for the back nine's 5th hole), while the segment's own `holeCount` is 9 — `formatMatchPlayResult` must use the hole result's own (already segment-relative) `holesRemaining` field, never `holeCount - completionHole`, or segment labels come out as nonsense like `"5 & -5"` (see the regression test in `nassau.test.ts`).

Settlements (`settlements.ts`) are a shared **greedy** largest-debtor/largest-creditor match, reused by both formats — deterministic and near-minimal, not a true minimum-transaction solver.

### Validation

Zod schemas in `src/validation/schemas.ts` serve form validation (`app/create-round.tsx`) and persisted-data integrity on hydration. `roundSchema` is a discriminated union on `format`. If you add a field to `Round`/`MatchPlayConfig`/etc. in `src/types/`, update the matching schema too, or the persistence layer will reject previously-valid data — and consider whether a migration step is needed (see above).

### Components vs. features

`src/components/` holds generic, context-free UI primitives — these must never import from `src/features` or `src/store`. Composite pieces specific to one part of the product (stake selector, player-form row, Match Play settings section, team-assignment section, round summary card, the scorecard grid) live under `src/features/<area>/`. `src/features/rounds/selectors.ts` is the read layer over a `Round` (balances, leader, match status headline, completed-hole count, etc.) and is format-aware internally — screens call `getPlayerBalances(round)` etc. without needing to branch on format themselves. Prefer adding a selector there over recomputing derived round data inline in a screen.

`src/features/rounds/ScorecardGrid.tsx` is the single shared scorecard component used by Review, History detail, and the Match Play Leaderboard's Scorecard tab — don't reintroduce a format- or screen-specific copy. It owns its own Gross/Net toggle (`SegmentedControl`, labeled "Gross Scores"/"Net Scores" so the state is legible without relying on which segment is highlighted) and renders each entered score via `ScoreMark` (`src/components/ScoreMark.tsx`), which draws the standard scorecard symbols — no symbol for par, circle for birdie, filled circle for eagle, filled circle with an outer ring for albatross-or-better, and the same three tiers as squares for bogey/double-bogey/triple-or-worse. Pass `onEditHole` to make headers/cells tappable (Review); omit it for read-only display (History). Every score cell has an explicit fixed width (`styles.scoreCell`, matching `holeHeaderCell`'s width) so columns stay aligned with the hole-number header regardless of which mark shape is drawn — don't let a cell's width come from its content again.

`SegmentedControl` (used by the Gross/Net toggle above and by full-width tab bars like Leaderboard's Match/Scorecard/Balances) sizes its segments with `flexGrow/flexShrink/flexBasis: "auto"`, not a bare `flex: 1` — with `flexBasis: 0` a hug-content container (like the scorecard's toggle) will shrink segments below their label's natural width and wrap the text. Keep `flexBasis: "auto"` if you touch this component.

Balance/win-loss UI never relies on color alone — it pairs color with an explicit sign and an icon (see `MoneyAmount`, `BalanceBadge`). Keep that pattern for any new financial-status UI.

### Design tokens

`src/constants/theme.ts` is the single source for `colors`/`spacing`/`radius`/`fontSize` — components should reference these, not hardcode hex values (the only other places colors are hardcoded on purpose are `app.json`'s splash/adaptive-icon config and `src/constants/golf.ts`'s fixed 4-color player-avatar palette, both kept in sync with the theme by hand since they're outside the RN bundle/require literal values). If you add a new semantic color, add it to `colors` rather than inlining a hex string in a component.
