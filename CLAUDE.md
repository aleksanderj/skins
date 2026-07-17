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

There are 133 unit tests: `src/utils/__tests__/` (Skins + shared + Challenges), `src/utils/matchPlay/__tests__/` (Match Play), `src/store/__tests__/` (persistence migration). Run `npm test` after touching anything in `src/utils/` or `src/store/migrations.ts`.

Native dependencies (`react-native-svg`, `expo-font`, `react-native-reanimated`, `react-native-worklets`, ...) must be added with `npx expo install <package>`, never plain `npm install` — it pins the version to the one matching this project's Expo SDK. A mismatched native module version is a common cause of Expo Go connecting, bundling successfully, then crashing on-device with no JS-visible error. `react-native-reanimated`/`react-native-worklets` in particular are **required even though nothing in this codebase imports them directly** — `react-native-screens`' native-stack transitions depend on worklets, and Expo Go has `libworklets.so` linked into its binary regardless of what a project declares, so omitting the JS-side packages produced a deterministic Hermes SIGSEGV (`libworklets.so` → `libhermesvm.so`, `mqt_v_js` thread) on literally the first screen transition on Android — reproduced with a clean SDK 57 template lacking the same two packages, confirmed fixed by adding them at the versions `expo install` resolves. Don't remove them.

`npx expo start --tunnel` (for testing on a phone that isn't on the same LAN) needs `@expo/ngrok` installed as a **local** `devDependency`, not global — Expo CLI resolves it via the project's own `node_modules`, so a global install is invisible to it and it'll still prompt to "install `@expo/ngrok`" (which fails outright in a non-interactive shell). It's already a devDependency here; if it ever goes missing, `npm install --save-dev @expo/ngrok` before retrying `--tunnel`.

## Architecture

**`app/` is routing only — no business logic.** Every screen is a thin composition of `src/components` + `src/features` pieces, reading/writing state via `useAppStore`. All scoring, balance, and settlement math lives in `src/utils/` as pure, independently-tested functions. When changing game rules, start in `src/utils/`, not in a screen.

### Route structure (Expo Router, file-based)

```
app/_layout.tsx                 root Stack: (tabs) group + onboarding + the round flow + global
                                 Toast mount + the Stack.Protected onboarding gate (see below)
app/(tabs)/                     bottom tab navigator with a custom tabBar (AppTabBar) — Home,
                                 History, Friends, Settings, plus a center FAB that opens Create Round
  index.tsx                      Home
  history/                       its own nested Stack (list with format filter + read-only detail,
                                  including a full read-only ScorecardGrid)
  friends.tsx                     shows a static sample roster (`src/features/friends/sampleFriends.ts`
                                   + `FriendRow`) — no real friends/contacts backend yet, and also the
                                   reason the tab row has 4 real tabs so the FAB sits dead-center
  settings.tsx                    grouped Skins Defaults / Match Play Defaults / General, plus a
                                   Developer entry point (__DEV__ only) into /dev-tools
app/onboarding.tsx              first-launch 5-slide swipeable intro (see "Onboarding" below)
app/dev-tools.tsx               dev-only: load an in-progress demo round, or drop a fully-scored
                                 completed round straight into History (see "Dev Tools" below)
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

`(tabs)` is a route group required to get a real bottom tab bar with Expo Router — a deliberate deviation from the flatter tree suggested in the original product spec (documented in README.md under "Route structure note"). Don't flatten it back out. `AppTabBar` lays the row out as five flex slots (Home, History, the FAB slot, Friends, Settings) so the absolutely-positioned center FAB never overlaps a tab label — don't go back to centering it directly over the row. The FAB itself is `GolfBallOnTeeIcon` (`src/components/GolfBallOnTeeIcon.tsx`, built with `react-native-svg`) with the "Start" label lettered onto the ball rather than shown as separate text underneath — it owns its own drop shadow, so don't wrap it in another shadowed container.

Editing a hole from Review deep-links into the scoring screen via `?hole=N`; whether "Save & Return" pops back to Review (`router.back()`) or just returns to the current frontier hole on the same screen depends on whether that param was present at mount (`cameFromReview` in `app/round/[roundId]/index.tsx`) — don't collapse this back into a single always-`router.back()` or always-`setDisplayedHole()` path, the two entry points need different behavior.

### State: one Zustand store, everything derived from scores

`src/store/useAppStore.ts` holds `activeRound`, `roundHistory`, `settings`, and `hasCompletedOnboarding`, persisted to `AsyncStorage` via zustand's `persist` middleware. Key invariant: **`Round.scores` (and `matchPlayPlayoffScores` for playoffs) is the only source of truth for game results.** `Round.skinsResult` / `Round.matchPlayResult` are cached derived values — every store action that touches scores or round config calls `recalculateRoundResult` (`src/features/rounds/recalculate.ts`), which dispatches to `calculateSkinResults` or `calculateMatchPlayRoundResult` based on `round.format`. Editing a past hole's score therefore transparently recalculates every later result and balance — never hand-patch a cached result or a balance directly. `createRound` and the dev-only demo loaders (below) both funnel through the same private `buildRoundFromInput` helper — don't duplicate that construction logic when adding another way to spin up a `Round`.

`src/store/useToastStore.ts` is a separate, tiny Zustand store (`{ toast, showToast(message), hideToast() }`) for one global toast banner, mounted once as `<Toast />` in `app/_layout.tsx`. Screens never render their own toast instances — call `showToast(message)` and the root-mounted component handles animation/dismissal. `Toast` slides up from the bottom (translateY + opacity, anchored above `insets.bottom`) and auto-dismisses after `VISIBLE_MS`; it does not persist and is unrelated to `useAppStore`.

`src/store/persistenceStorage.ts` wraps `AsyncStorage` with a migration pass (`src/store/migrations.ts`) followed by Zod validation (`src/validation/schemas.ts`) before zustand hydrates. Persisted state carries a `schemaVersion` (currently 3); `migratePersistedState` upgrades legacy rounds/settings to the current shape before validation runs, and defaults `hasCompletedOnboarding` to `true` for any pre-existing persisted state (a returning user should never see onboarding retroactively) but `false` for a fresh install. Invalid/corrupt persisted JSON — before or after migration — is discarded (treated as "no saved state") rather than thrown — `didResetCorruptData()` flags this for a one-time banner in `app/_layout.tsx`. **If you change the persisted shape again, add a migration step, don't just bump types** — there are real users' rounds in `AsyncStorage` this has to keep loading.

**Onboarding gate:** `app/_layout.tsx` gates the `onboarding` screen vs. everything else with two `<Stack.Protected guard={...}>` blocks keyed off `hasCompletedOnboarding` — not an imperative `router.replace()`. **This is a hard-won fix, not a style preference:** an earlier version called `router.replace("/onboarding")` inside the post-hydration `useEffect`, which fired while the native stack navigator (`react-native-screens`) was still mounting and caused a 100%-reproducible native crash on Android (worked fine on web, which has no native view hierarchy to race against — see the Hermes/`libworklets.so` SIGSEGV note below). `Stack.Protected` handles the redirect declaratively without navigating during mount. If you add more gated states, extend the `Stack.Protected` groups rather than reintroducing an imperative redirect in a mount-time effect.

**TEMP — onboarding currently shows on every cold start**, not just first launch: `onRehydrateStorage` in `useAppStore.ts` force-resets `hasCompletedOnboarding` to `false` right after hydration, overriding whatever was actually persisted. This is a deliberate, explicitly-marked product decision while the onboarding flow is still being iterated on, not a bug — don't "fix" it by deleting that line without checking with the user first. The line is commented with exactly what to remove to restore normal "only show once" behavior.

### Round is one type, two formats

`Round.format: "skins" | "match_play"` discriminates which optional sub-object is populated: `skinsConfig`/`skinsResult` or `matchPlayConfig`/`matchPlayResult`/`matchPlayPlayoffScores`. Format-specific fields are never flattened onto the base `Round` — see `src/types/index.ts`. Shared fields (`players`, `holes`, `scores`, `currency`, `holeCount`, ...) work identically across both formats.

### Challenges (side bets, format-agnostic)

`Round.challenges?: Challenge[]` (closest-to-the-pin / longest-drive) is an independent side-bet layer orthogonal to Skins vs. Match Play — the field is optional so legacy persisted rounds validate without a migration. `calculateChallengeBalances` (`src/utils/challenges.ts`) applies the same "loser pays winner" model Skins already uses (every other player owes the stake to whoever's `winnerPlayerId`), and `getPlayerBalances` (`src/features/rounds/selectors.ts`) layers those balances on top of the format balance before any screen ever reads it — Home, History, Leaderboard, and Settlement all pick this up for free without touching them.

**Adding a challenge only happens at round creation** (`ChallengesSetupSection` in `app/create-round.tsx`, backed by `CreateRoundInput.challenges` → `buildRoundFromInput`), not mid-round — a deliberate product decision. The in-round `ChallengesSection` (Leaderboard's "Challenges" tab) is read-mostly: tap a player chip to mark them the winner (tap again to clear), or remove a challenge set up in error; there's no in-round "add" UI or store action. `AddChallengeModal` is shared by both call sites and takes primitive props (`holes`, `holeCount`, `currency`) rather than a `Round`, since no `Round` exists yet during creation.

Challenges are also surfaced read-only in two more places, both driven by `getChallengesForHole(round, holeNumber)` in `selectors.ts`: the scoring screen shows a stake badge on the current hole's `HoleInfoCard` (`ChallengeHoleBadges`, composed by the screen and passed into the card's `headerRight` slot — see below) plus a `ChallengeInfoRow` beneath it that deep-links to Leaderboard's Challenges tab (`?tab=challenges`, read by `leaderboard.tsx` to preselect that segment) to actually resolve it; Review shows `ChallengeResultRow` per challenge — winner/payout if decided, "Not decided" if not. None of these three components write to the store; they're presentation over the same `Challenge[]`/selector data every other screen already reads.

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

`src/components/HoleInfoCard.tsx` is the shared dark-green hole-summary card behind all three scoring flows (Skins, Match Play, sudden-death playoff) — hole number, par/stroke index, the decorative `HoleFlagIllustration`, an optional `headerRight` slot (challenge badges, the Skins carryover pill) and an optional `footer` slot (Skins' "Worth N skins / at stake" row; Match Play and the playoff screen pass none). `SkinValueCard` wraps it for the Skins-specific footer. Because this lives in `src/components/`, it stays free of `src/features` imports — challenge badges (`ChallengeHoleBadges`) are composed by the calling screen and handed in via `headerRight`/`challengeBadges`, not built inside the card itself. `src/components/IconCircleButton.tsx` is the floating white circular icon button used for the round header's leaderboard shortcut, the hole navigator's back/forward controls, and Review's round-options button — one primitive rather than repeated one-off `Pressable` + `Ionicons` pairs, so sizing/shadow stay consistent everywhere it shows up.

`src/features/rounds/ScorecardGrid.tsx` is the single shared scorecard component used by Review, History detail, and the Match Play Leaderboard's Scorecard tab — don't reintroduce a format- or screen-specific copy. Its header (icon + "Scorecard" title left, the Gross/Net toggle right, both on one row) renders each entered score via `ScoreMark` (`src/components/ScoreMark.tsx`), which draws the standard scorecard symbols — no symbol for par, circle for birdie, filled circle for eagle, filled circle with an outer ring for albatross-or-better, and the same three tiers as squares for bogey/double-bogey/triple-or-worse. Pass `onEditHole` to make headers/cells tappable (Review); omit it for read-only display (History). Every score cell has an explicit fixed width (`styles.scoreCell`, matching `holeHeaderCell`'s width) so columns stay aligned with the hole-number header regardless of which mark shape is drawn — don't let a cell's width come from its content again. Each player row also gets a `PlayerAvatar` with `singleInitial` (just the first letter, not the usual two) to fit the tight name column.

`SegmentedControl` (used by the Gross/Net toggle above and by full-width tab bars like Leaderboard's Match/Scorecard/Balances) sizes its segments with `flexGrow/flexShrink/flexBasis: "auto"`, not a bare `flex: 1` — with `flexBasis: 0` a hug-content container (like the scorecard's toggle) will shrink segments below their label's natural width and wrap the text. Keep `flexBasis: "auto"` if you touch this component. It also takes an optional `variant` ("light", the default iOS-style white-chip-on-gray-track look for tab bars, vs. "dark", a solid `primaryDark` selected chip for the Scorecard toggle) and a `compact` flag (smaller padding/font, used only by the Scorecard header so the toggle can share a row with the title instead of needing its own line). That compactness matters more than it looks: a title + toggle row that measures fine in a desktop browser can still overflow on a real device, because Android's system font renders the same label text wider than desktop Chromium does — a bug that reproduced consistently on-device but not in a same-width headless-browser check. `compact` plus `numberOfLines={1}` on both the title and the segment labels is the margin of safety; don't remove either while assuming a single desktop screenshot proves the layout fits everywhere.

**Never nest a `Pressable` with `accessibilityRole="button"` inside another one.** react-native-web renders that role as a literal HTML `<button>`, and `<button>` cannot contain `<button>` — the browser silently splits the DOM to fix it, which throws a console error and can break hit-testing. This bit `RoundSummaryCard`: the whole card is a tappable `Pressable` (navigates to round detail), and it used to have a "⋮" options `Pressable` nested inside it for the per-round menu. Fix was to make them siblings instead — an outer `cardWrapper` View holds the card's navigation `Pressable` *and* a separately-positioned `menuButton` `Pressable` (absolutely positioned to land in the same visual spot), so neither is a DOM descendant of the other. Reach for this sibling-plus-absolute-position pattern any time a tappable card needs its own nested tappable control.

`src/components/SettlementSummaryCard.tsx` (Total Pot headline + a single card of "X owes Y" rows + a disclaimer pill) is the current settlement design — used by History detail, the round-complete screen, and (with fabricated data) the onboarding "Settle Up" slide. `src/components/SettlementCard.tsx` (the older per-payment card with a settled/unsettled checkbox) is no longer referenced by any screen; don't add new usages of it without checking whether it should just be deleted instead.

Balance/win-loss UI never relies on color alone — it pairs color with an explicit sign and an icon (see `MoneyAmount`, `BalanceBadge`). Keep that pattern for any new financial-status UI.

### Onboarding

`app/onboarding.tsx` is a 5-slide, horizontally-paged intro (`ScrollView` + `pagingEnabled`, dot indicator, Next/Get Started footer button shared across slides rather than duplicated per-slide). Slide content lives in `src/features/onboarding/`: `GradientCourseBackground` is a code-drawn SVG gradient/hills illustration (used where there's no background photo), `ImageFadeOverlay` is an SVG gradient absolutely-positioned over the bottom third of every slide's image/illustration area to fade it into the screen background instead of a hard cutoff, and `ScoringPreviewCard`/`StandingsPreviewCard`/`SettlementPreviewCard` are static marketing mockups with fabricated data — the latter two directly reuse `LeaderboardRow` and `SettlementSummaryCard` for visual consistency with the real app rather than reimplementing similar-looking UI. The three photo backgrounds (`assets/onboarding-*.png`) were pre-cropped toward their focal content (with `sharp`, not at runtime) before bundling — they're tall portrait source images and RN's `resizeMode="cover"` centers by default, which without cropping put the interesting part of each photo outside the visible frame.

### Dev Tools

`app/dev-tools.tsx`, linked from Settings' Developer section (`__DEV__` only), replaced the old inline demo buttons that used to live on Home. It has two independent capabilities: "Load Active Round" (the original three demo seeds — Skins, Individual Match, Team Nassau — that start a real in-progress round via `createRound`) and "Add Completed Round to History" (`loadCompletedDemoRound` in the store), which fabricates a fully-scored, already-`completed` round and drops it straight into `roundHistory` without going through score entry. The fabricated scores come from `generateDemoScores` (`src/features/rounds/demoRound.ts`): a per-player skill offset plus a deterministic per-player-per-hole pseudo-noise term (a sine-hash, not `Math.random()`, so results are reproducible) — tuned so results are decisive but not a wire-to-wire sweep. If you add a fourth demo scenario, reuse this generator rather than hand-writing scores.

### Design tokens

`src/constants/theme.ts` is the single source for `colors`/`spacing`/`radius`/`fontSize` — components should reference these, not hardcode hex values (the only other places colors are hardcoded on purpose are `app.json`'s splash/adaptive-icon config and `src/constants/golf.ts`'s fixed 4-color player-avatar palette, both kept in sync with the theme by hand since they're outside the RN bundle/require literal values). If you add a new semantic color, add it to `colors` rather than inlining a hex string in a component.
