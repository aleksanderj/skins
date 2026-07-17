import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppStore } from "../../../src/store/useAppStore";
import { useToastStore } from "../../../src/store/useToastStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SecondaryButton } from "../../../src/components/SecondaryButton";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";
import { SkinValueCard } from "../../../src/components/SkinValueCard";
import { HoleInfoCard } from "../../../src/components/HoleInfoCard";
import { PlayerScoreRow } from "../../../src/components/PlayerScoreRow";
import { MatchStatusCard } from "../../../src/components/MatchStatusCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { TeamBadge } from "../../../src/components/TeamBadge";
import { PlayoffBanner } from "../../../src/components/PlayoffBanner";
import { ScoreStepper } from "../../../src/components/ScoreStepper";
import { EmptyState } from "../../../src/components/EmptyState";
import { IconCircleButton } from "../../../src/components/IconCircleButton";
import { ChallengeHoleBadges } from "../../../src/features/challenges/ChallengeHoleBadges";
import { ChallengeInfoRow } from "../../../src/features/challenges/ChallengeInfoRow";
import {
  getChallengesForHole,
  getPlayerBalances,
  getRoundMatchPlaySides,
  isAwaitingPlayoff,
  isHoleComplete,
  isMatchPlayDecided,
} from "../../../src/features/rounds/selectors";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../../../src/utils/handicap";
import { formatSignedCurrency } from "../../../src/utils/currency";
import { calculateRelativeMatchPlayHandicaps, getMatchPlayStrokesForHole } from "../../../src/utils/matchPlay";
import { colors, fontSize, spacing, touchTarget } from "../../../src/constants/theme";
import type { MatchPlayPlayoffResult, MatchPlaySide, Round } from "../../../src/types";

export default function RoundOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { roundId, hole: holeParam } = useLocalSearchParams<{ roundId: string; hole?: string }>();
  const requestedHole = holeParam ? parseInt(holeParam, 10) : null;
  const activeRound = useAppStore((s) => s.activeRound);
  const setHoleScore = useAppStore((s) => s.setHoleScore);
  const submitHole = useAppStore((s) => s.submitHole);
  const abandonRound = useAppStore((s) => s.abandonRound);

  const round = activeRound && activeRound.id === roundId ? activeRound : null;

  const [displayedHole, setDisplayedHole] = useState(requestedHole ?? round?.currentHole ?? 1);
  const [showMenu, setShowMenu] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  // Entering the playoff is a deliberate action (the "Start Playoff" button
  // below), not something derived reactively from round state — if it were
  // reactive, the instant regulation ties on the last hole the screen would
  // swap out from under the user before they ever see the "Hole Halved"
  // result panel for hole 18. Once true it also stays true for the rest of
  // this screen's lifetime, so a decisive playoff hole doesn't un-flip it
  // before the user sees the playoff result.
  const [playoffModeEntered, setPlayoffModeEntered] = useState(false);

  useEffect(() => {
    // Deep-linking to a specific hole (from Review's "edit" action) should win
    // over the normal "resume where you left off" sync.
    if (round && requestedHole === null) setDisplayedHole(round.currentHole);
    // Resuming a round where a playoff was already under way should go
    // straight back into it. Only checked on mount / round switch, not on
    // every mutation, so it can't fire mid-entry.
    if (round && (round.matchPlayPlayoffScores?.length ?? 0) > 0) setPlayoffModeEntered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id]);

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Round" onBack={() => router.replace("/")} />
        <EmptyState
          icon="alert-circle-outline"
          title="No active round"
          message="This round has already finished or was abandoned."
          actionLabel="Go home"
          onAction={() => router.replace("/")}
        />
      </View>
    );
  }

  const handleAbandon = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    abandonRound();
    setShowAbandonConfirm(false);
    router.replace("/");
  };

  // Deliberately NOT `|| isAwaitingPlayoff(round)` here — see the
  // playoffModeEntered comment above for why that has to be a one-way,
  // user-triggered latch rather than a live derived value.
  const playoffActive = playoffModeEntered;
  const matchLabel = round.format === "match_play" ? "MATCH PLAY" : "SKINS";
  // Review's "edit this hole" action deep-links here with a `hole` param and
  // pushes this screen on top of Review, so it's on the nav stack right below
  // us. Only in that case should "Save & Return" pop back to Review — normal
  // in-round navigation (stepping back with the HoleNavigator arrows) should
  // stay on this screen and return to the current frontier hole instead.
  const cameFromReview = requestedHole !== null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title={round.courseName}
        subtitle={matchLabel}
        onBack={() => router.replace("/")}
        right={
          <View style={styles.headerActions}>
            <IconCircleButton
              icon="stats-chart"
              onPress={() => router.push(`/round/${round.id}/leaderboard`)}
              accessibilityLabel="View leaderboard"
            />
            <Pressable
              onPress={() => setShowMenu(true)}
              accessibilityRole="button"
              accessibilityLabel="Round options"
              style={styles.headerButton}
              hitSlop={4}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
            </Pressable>
          </View>
        }
      />

      {playoffActive ? (
        <PlayoffFlow round={round} />
      ) : round.format === "match_play" ? (
        <MatchPlayFlow
          round={round}
          displayedHole={displayedHole}
          setDisplayedHole={setDisplayedHole}
          cameFromReview={cameFromReview}
          onStartPlayoff={() => {
            useAppStore.getState().startMatchPlayPlayoff();
            setPlayoffModeEntered(true);
          }}
        />
      ) : (
        <SkinsFlow
          round={round}
          displayedHole={displayedHole}
          setDisplayedHole={setDisplayedHole}
          setHoleScore={setHoleScore}
          submitHole={submitHole}
          cameFromReview={cameFromReview}
        />
      )}

      <ConfirmationModal
        visible={showMenu}
        title="Round options"
        confirmLabel="Abandon Round"
        cancelLabel="Close"
        destructive
        onConfirm={() => {
          setShowMenu(false);
          setShowAbandonConfirm(true);
        }}
        onCancel={() => setShowMenu(false)}
      />

      <ConfirmationModal
        visible={showAbandonConfirm}
        title="Abandon this round?"
        message="Scores entered so far will be lost. This round will not be saved to history."
        confirmLabel="Abandon Round"
        cancelLabel="Keep Playing"
        destructive
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonConfirm(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared: hole back/forward navigator
// ---------------------------------------------------------------------------

/** Lets the user step back to an already-played hole to review/edit it, and forward again up to the frontier. */
function HoleNavigator({
  label,
  displayedNumber,
  totalCount,
  maxNavigable,
  onBack,
  onForward,
}: {
  label: string;
  displayedNumber: number;
  /** The true total to show in the label (e.g. round.holeCount) — never the navigation frontier. */
  totalCount: number;
  /** How far forward the user is allowed to step — the frontier hole/playoff-hole, which can be less than totalCount. */
  maxNavigable: number;
  onBack: () => void;
  onForward: () => void;
}) {
  const canGoBack = displayedNumber > 1;
  const canGoForward = displayedNumber < maxNavigable;

  return (
    <View style={styles.holeNavRow}>
      <IconCircleButton
        icon="chevron-back"
        onPress={onBack}
        disabled={!canGoBack}
        accessibilityLabel={`Previous ${label.toLowerCase()}`}
        iconSize={24}
      />
      <Text style={styles.holeNavLabel}>
        {label} {displayedNumber} of {totalCount}
      </Text>
      <IconCircleButton
        icon="chevron-forward"
        onPress={onForward}
        disabled={!canGoForward}
        accessibilityLabel={`Next ${label.toLowerCase()}`}
        iconSize={24}
      />
    </View>
  );
}

function statusHeadline(status: number, sideAName: string, sideBName: string): string {
  if (status === 0) return "All Square";
  const leader = status > 0 ? sideAName : sideBName;
  return `${leader} ${Math.abs(status)} Up`;
}

// ---------------------------------------------------------------------------
// Skins
// ---------------------------------------------------------------------------

/** Builds the toast copy for a just-completed Skins hole. */
function buildSkinsToastMessage(round: Round, holeNumber: number): string {
  const skinResults = round.skinsResult?.skinResults ?? [];
  const result = skinResults.find((r) => r.holeNumber === holeNumber);
  if (!result) return "Score saved";

  if (result.winnerPlayerId) {
    const winner = round.players.find((p) => p.id === result.winnerPlayerId);
    return `${winner?.name ?? "A player"} wins ${result.skinsWon} skin${result.skinsWon > 1 ? "s" : ""}`;
  }

  if (!round.skinsConfig?.carryoversEnabled) {
    return "Hole tied — no skin awarded";
  }

  const stakePerSkinCents = round.skinsConfig?.stakePerSkinCents ?? 1;
  const skinsCarried = result.carriedIntoNextHoleCents / stakePerSkinCents;
  const skinWord = skinsCarried === 1 ? "skin" : "skins";
  const isFinalHole = holeNumber === round.holeCount;

  return isFinalHole
    ? `Hole tied — ${skinsCarried} ${skinWord} unresolved`
    : `Hole tied — ${skinsCarried} ${skinWord} carr${skinsCarried === 1 ? "ies" : "y"} to hole ${holeNumber + 1}`;
}

function SkinsFlow({
  round,
  displayedHole,
  setDisplayedHole,
  setHoleScore,
  submitHole,
  cameFromReview,
}: {
  round: Round;
  displayedHole: number;
  setDisplayedHole: (h: number) => void;
  setHoleScore: (playerId: string, holeNumber: number, grossScore: number | null) => void;
  submitHole: (holeNumber: number) => void;
  cameFromReview: boolean;
}) {
  const insets = useSafeAreaInsets();
  const playingHandicaps = useMemo(() => {
    const map: Record<string, number> = {};
    round.players.forEach((p) => {
      map[p.id] = calculatePlayingHandicap(p.handicap, round.holeCount);
    });
    return map;
  }, [round.players, round.holeCount]);

  const hole = round.holes.find((h) => h.number === displayedHole);
  const balances = getPlayerBalances(round);
  const isComplete = isHoleComplete(round, displayedHole);
  const isFinalHole = displayedHole === round.holeCount;
  const isEditingPastHole = displayedHole < round.currentHole;
  const skinResults = round.skinsResult?.skinResults ?? [];
  const isCarryoverHole = skinResults.some(
    (r) => r.holeNumber === displayedHole - 1 && r.carriedIntoNextHoleCents > 0
  );
  const stakePerSkinCents = round.skinsConfig?.stakePerSkinCents ?? 0;
  const skinsAtStake = isCarryoverHole
    ? 1 + (skinResults.find((r) => r.holeNumber === displayedHole - 1)?.carriedIntoNextHoleCents ?? 0) / stakePerSkinCents
    : 1;
  const challengesThisHole = getChallengesForHole(round, displayedHole);

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    useToastStore.getState().showToast(buildSkinsToastMessage(round, displayedHole));
    submitHole(displayedHole);

    if (isEditingPastHole) {
      if (cameFromReview) {
        router.back();
      } else {
        setDisplayedHole(round.currentHole);
      }
    } else if (isFinalHole) {
      router.push(`/round/${round.id}/review`);
    } else {
      setDisplayedHole(displayedHole + 1);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
      <HoleNavigator
        label="Hole"
        displayedNumber={displayedHole}
        totalCount={round.holeCount}
        maxNavigable={round.currentHole}
        onBack={() => setDisplayedHole(displayedHole - 1)}
        onForward={() => setDisplayedHole(displayedHole + 1)}
      />

      {hole ? (
        <SkinValueCard
          holeNumber={hole.number}
          par={hole.par}
          strokeIndex={hole.strokeIndex}
          skinsAtStake={skinsAtStake}
          stakePerSkinCents={stakePerSkinCents}
          currency={round.currency}
          isCarryover={isCarryoverHole}
          challengeBadges={
            challengesThisHole.length > 0 ? (
              <ChallengeHoleBadges challenges={challengesThisHole} currency={round.currency} />
            ) : null
          }
        />
      ) : null}

      {challengesThisHole.map((challenge) => (
        <ChallengeInfoRow
          key={challenge.id}
          challenge={challenge}
          currency={round.currency}
          onPressInfo={() => router.push(`/round/${round.id}/leaderboard?tab=challenges`)}
        />
      ))}

      <View style={styles.scoreList}>
        {round.players.map((player, index) => {
          const scoreRecord = round.scores.find((s) => s.playerId === player.id && s.holeNumber === displayedHole);
          const grossScore = scoreRecord?.grossScore ?? null;
          const strokes = hole
            ? getHandicapStrokesForHole(playingHandicaps[player.id] ?? 0, hole.strokeIndex, round.holeCount)
            : 0;
          const netScore = calculateNetScore(grossScore, strokes);
          const balance = balances.find((b) => b.playerId === player.id)?.balanceCents ?? 0;

          return (
            <PlayerScoreRow
              key={player.id}
              name={player.name}
              index={index}
              grossScore={grossScore}
              strokesReceived={strokes}
              netScore={netScore}
              showNet={round.skinsConfig?.scoringMode === "net"}
              balanceCents={balance}
              currency={round.currency}
              defaultScore={hole?.par ?? 4}
              onChangeScore={(value) => setHoleScore(player.id, displayedHole, value)}
            />
          );
        })}
      </View>

      <PrimaryButton
        label={isEditingPastHole ? "Save & Return" : "Submit Hole"}
        onPress={handleSubmit}
        disabled={!isComplete}
        style={styles.actionButton}
        accessibilityHint={isComplete ? undefined : "Enter every player's score to continue"}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Match Play (regulation, single match or Nassau)
// ---------------------------------------------------------------------------

/** Builds the toast copy for a just-completed Match Play hole. */
function buildMatchPlayToastMessage(
  round: Round,
  sides: { sideA: MatchPlaySide; sideB: MatchPlaySide },
  holeNumber: number
): string {
  const result = round.matchPlayResult;
  let holeResult;
  if (result?.structure === "single_match") {
    holeResult = result.singleMatch?.holeResults.find((h) => h.holeNumber === holeNumber);
  } else if (result?.structure === "nassau") {
    const overall = result.nassauMatches?.find((m) => m.segment === "overall");
    holeResult = overall?.holeResults.find((h) => h.holeNumber === holeNumber);
  }
  if (!holeResult) return "Score saved";

  if (holeResult.winnerSideId) {
    const winnerName = holeResult.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name;
    if (isMatchPlayDecided(round)) return `${winnerName} wins the match!`;
    return `${winnerName} wins Hole ${holeNumber} — ${statusHeadline(holeResult.statusAfterHole, sides.sideA.name, sides.sideB.name)}`;
  }

  return `Hole ${holeNumber} halved — ${statusHeadline(holeResult.statusAfterHole, sides.sideA.name, sides.sideB.name)}`;
}

function MatchPlayFlow({
  round,
  displayedHole,
  setDisplayedHole,
  cameFromReview,
  onStartPlayoff,
}: {
  round: Round;
  displayedHole: number;
  setDisplayedHole: (h: number) => void;
  cameFromReview: boolean;
  onStartPlayoff: () => void;
}) {
  const insets = useSafeAreaInsets();
  const setHoleScore = useAppStore((s) => s.setHoleScore);
  const config = round.matchPlayConfig;
  const sides = getRoundMatchPlaySides(round);
  const [phase, setPhase] = useState<"entry" | "decision">("entry");

  const relativeHandicaps = useMemo(() => {
    if (!config || !sides) return {};
    const handicapPlayers = round.players.filter(
      (p) => sides.sideA.playerIds.includes(p.id) || sides.sideB.playerIds.includes(p.id)
    );
    return calculateRelativeMatchPlayHandicaps(handicapPlayers, round.holeCount, config.handicapAllowancePercent);
  }, [config, sides, round.players, round.holeCount]);

  if (!config || !sides) {
    return (
      <View style={styles.scroll}>
        <EmptyState icon="alert-circle-outline" title="Match setup incomplete" message="Check the round's team assignments." />
      </View>
    );
  }

  const hole = round.holes.find((h) => h.number === displayedHole);
  const isComplete = isHoleComplete(round, displayedHole);
  const isEditingPastHole = displayedHole < round.currentHole;
  const challengesThisHole = getChallengesForHole(round, displayedHole);

  const goToHole = (holeNumber: number) => {
    setPhase("entry");
    setDisplayedHole(holeNumber);
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    useToastStore.getState().showToast(buildMatchPlayToastMessage(round, sides, displayedHole));

    if (isEditingPastHole) {
      useAppStore.getState().submitMatchPlayHole(displayedHole);
      if (cameFromReview) {
        router.back();
      } else {
        goToHole(round.currentHole);
      }
      return;
    }

    // The match/Nassau result was already recalculated live as scores were
    // entered, so this reflects the just-completed hole without needing to
    // touch the store first.
    const justDecided = isMatchPlayDecided(round);
    const justAwaitingPlayoff = isAwaitingPlayoff(round);

    if (justDecided || justAwaitingPlayoff) {
      // Deliberately do NOT advance currentHole here — displayedHole stays
      // parked on this hole to show the decision panel. Advancing currentHole
      // without also advancing displayedHole would make isEditingPastHole
      // look true (currentHole > displayedHole) even though the user hasn't
      // navigated anywhere, hiding the decision panel behind a phantom
      // "Save & Return" state. currentHole only moves once the user actually
      // proceeds (Continue Scoring) — see below.
      setPhase("decision");
    } else {
      useAppStore.getState().submitMatchPlayHole(displayedHole);
      goToHole(displayedHole + 1);
    }
  };

  const decided = isMatchPlayDecided(round);
  const awaitingPlayoffStart = isAwaitingPlayoff(round);
  const showDecisionPanel = phase === "decision" && !isEditingPastHole && (decided || awaitingPlayoffStart);

  const singleMatch = round.matchPlayResult?.structure === "single_match" ? round.matchPlayResult.singleMatch : undefined;
  const lastHoleResult = singleMatch?.holeResults[singleMatch.holeResults.length - 1];

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
      <HoleNavigator
        label="Hole"
        displayedNumber={displayedHole}
        totalCount={round.holeCount}
        maxNavigable={round.currentHole}
        onBack={() => goToHole(displayedHole - 1)}
        onForward={() => goToHole(displayedHole + 1)}
      />

      {config.structure === "single_match" ? (
        <MatchStatusCard
          headline={lastHoleResult ? statusHeadline(lastHoleResult.statusAfterHole, sides.sideA.name, sides.sideB.name) : "All Square"}
          subline={lastHoleResult ? `Through ${lastHoleResult.holeNumber}` : "Not started"}
          isDormie={lastHoleResult?.isDormie}
        />
      ) : config.structure === "nassau" ? (
        <NassauSummary round={round} sides={sides} />
      ) : null}

      {hole ? (
        <HoleInfoCard
          holeNumber={hole.number}
          par={hole.par}
          strokeIndex={hole.strokeIndex}
          headerRight={
            challengesThisHole.length > 0 ? (
              <ChallengeHoleBadges challenges={challengesThisHole} currency={round.currency} />
            ) : null
          }
        />
      ) : null}

      {challengesThisHole.map((challenge) => (
        <ChallengeInfoRow
          key={challenge.id}
          challenge={challenge}
          currency={round.currency}
          onPressInfo={() => router.push(`/round/${round.id}/leaderboard?tab=challenges`)}
        />
      ))}

      <MatchPlayScoreRows
        round={round}
        hole={hole}
        holeNumber={displayedHole}
        sides={sides}
        relativeHandicaps={relativeHandicaps}
        scores={round.scores}
        onChangeScore={(playerId, value) => setHoleScore(playerId, displayedHole, value)}
      />

      {!showDecisionPanel ? (
        <PrimaryButton
          label={isEditingPastHole ? "Save & Return" : "Submit Hole"}
          onPress={handleSubmit}
          disabled={!isComplete}
          style={styles.actionButton}
          accessibilityHint={isComplete ? undefined : "Enter every player's score to continue"}
        />
      ) : (
        <View style={styles.resultPanel}>
          <MatchPlayResultSummary round={round} sides={sides} displayedHole={displayedHole} />
          <View style={styles.resultActions}>
            {decided ? (
              <PrimaryButton
                label="Finish Round"
                onPress={() => router.push(`/round/${round.id}/review`)}
                style={styles.resultButton}
              />
            ) : (
              <PrimaryButton label="Start Playoff" onPress={onStartPlayoff} style={styles.resultButton} />
            )}
          </View>
          {decided ? (
            <SecondaryButton
              label="Continue Scoring for Scorecard"
              onPress={() => {
                useAppStore.getState().submitMatchPlayHole(displayedHole);
                goToHole(displayedHole + 1);
              }}
              style={styles.continueScoringButton}
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function NassauSummary({ round, sides }: { round: Round; sides: { sideA: MatchPlaySide; sideB: MatchPlaySide } }) {
  const matches = round.matchPlayResult?.structure === "nassau" ? round.matchPlayResult.nassauMatches ?? [] : [];
  const stakeCents = round.matchPlayConfig?.stakeCents ?? 0;
  const titles: Record<string, string> = { front: "Front Nine", back: "Back Nine", overall: "Overall" };

  return (
    <View style={styles.nassauSummary}>
      {matches.map((match) => {
        const last = match.holeResults[match.holeResults.length - 1];
        const statusText = last
          ? `${statusHeadline(last.statusAfterHole, sides.sideA.name, sides.sideB.name)} through ${last.holeNumber - match.startHole + 1}`
          : "All Square";
        const winnerName = match.winnerSideId ? (match.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name) : null;
        return (
          <NassauStatusCard
            key={match.segment}
            title={titles[match.segment]}
            statusText={statusText}
            resultLabel={match.resultLabel}
            winnerName={winnerName}
            stakeCents={stakeCents}
            currency={round.currency}
          />
        );
      })}
    </View>
  );
}

function MatchPlayScoreRows({
  round,
  hole,
  holeNumber,
  sides,
  relativeHandicaps,
  scores,
  onChangeScore,
}: {
  round: Round;
  hole: Round["holes"][number] | undefined;
  holeNumber: number;
  sides: { sideA: MatchPlaySide; sideB: MatchPlaySide };
  relativeHandicaps: Record<string, number>;
  scores: Round["scores"];
  onChangeScore: (playerId: string, value: number) => void;
}) {
  const config = round.matchPlayConfig!;
  const showNet = config.scoringMode === "net";

  const renderPlayerRow = (playerId: string, side: "A" | "B") => {
    const player = round.players.find((p) => p.id === playerId);
    if (!player) return null;
    const record = scores.find((s) => s.playerId === playerId && s.holeNumber === holeNumber);
    const grossScore = record?.grossScore ?? null;
    const strokes = hole ? getMatchPlayStrokesForHole(relativeHandicaps[playerId] ?? 0, hole.strokeIndex, round.holeCount) : 0;
    const netScore = calculateNetScore(grossScore, strokes);
    const netLine = showNet
      ? [strokes > 0 ? `${strokes} stroke${strokes > 1 ? "s" : ""}` : null, netScore !== null ? `net ${netScore}` : null]
          .filter(Boolean)
          .join(" · ")
      : "";

    return (
      <View key={playerId} style={rowStyles.row}>
        <View style={rowStyles.identity}>
          {config.mode === "team" ? <TeamBadge name={side === "A" ? sides.sideA.name : sides.sideB.name} side={side} /> : null}
          <Text style={rowStyles.name}>{player.name}</Text>
          {netLine ? <Text style={rowStyles.net}>{netLine}</Text> : null}
        </View>
        <ScoreStepper
          value={grossScore}
          onChange={(value) => onChangeScore(playerId, value)}
          defaultValue={hole?.par ?? 4}
          label={player.name}
        />
      </View>
    );
  };

  if (config.mode === "individual") {
    return (
      <View style={styles.scoreList}>
        {sides.sideA.playerIds.map((id) => renderPlayerRow(id, "A"))}
        {sides.sideB.playerIds.map((id) => renderPlayerRow(id, "B"))}
      </View>
    );
  }

  // Team mode: group rows by team, with a best-score preview above the submit button.
  const bestFor = (side: MatchPlaySide) => {
    const values = side.playerIds
      .map((id) => {
        const record = scores.find((s) => s.playerId === id && s.holeNumber === holeNumber);
        if (!record || record.grossScore === null) return null;
        if (!hole) return null;
        const strokes = getMatchPlayStrokesForHole(relativeHandicaps[id] ?? 0, hole.strokeIndex, round.holeCount);
        return config.scoringMode === "net" ? record.grossScore - strokes : record.grossScore;
      })
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.min(...values) : null;
  };

  const bestA = bestFor(sides.sideA);
  const bestB = bestFor(sides.sideB);

  return (
    <View style={styles.scoreList}>
      {sides.sideA.playerIds.map((id) => renderPlayerRow(id, "A"))}
      {sides.sideB.playerIds.map((id) => renderPlayerRow(id, "B"))}

      {bestA !== null && bestB !== null ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>
            {sides.sideA.name} best {showNet ? "net" : "gross"}: {bestA}
          </Text>
          <Text style={styles.previewText}>
            {sides.sideB.name} best {showNet ? "net" : "gross"}: {bestB}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function MatchPlayResultSummary({
  round,
  sides,
  displayedHole,
}: {
  round: Round;
  sides: { sideA: MatchPlaySide; sideB: MatchPlaySide };
  displayedHole: number;
}) {
  const result = round.matchPlayResult;
  let holeResult;
  if (result?.structure === "single_match") {
    holeResult = result.singleMatch?.holeResults.find((h) => h.holeNumber === displayedHole);
  } else if (result?.structure === "nassau") {
    const overall = result.nassauMatches?.find((m) => m.segment === "overall");
    holeResult = overall?.holeResults.find((h) => h.holeNumber === displayedHole);
  }
  if (!holeResult) return null;

  const decided = isMatchPlayDecided(round);

  if (holeResult.winnerSideId) {
    const winnerName = holeResult.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name;
    return (
      <View>
        <Text style={styles.resultTitle}>
          {winnerName} wins Hole {displayedHole}
        </Text>
        <Text style={styles.resultSubtitle}>
          {decided
            ? "Match Complete"
            : `${winnerName} moves to ${statusHeadline(holeResult.statusAfterHole, sides.sideA.name, sides.sideB.name)}`}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.resultTitle}>Hole Halved</Text>
      <Text style={styles.resultSubtitle}>
        {statusHeadline(holeResult.statusAfterHole, sides.sideA.name, sides.sideB.name)} remains
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sudden-death playoff
// ---------------------------------------------------------------------------

/** Computes which playoff hole should be showing right now, from the round's playoff results so far. */
function nextPlayoffHoleFrom(playoffResults: MatchPlayPlayoffResult[]): number {
  if (playoffResults.length === 0) return 1;
  const last = playoffResults[playoffResults.length - 1];
  return last.winnerSideId === null ? last.playoffHoleNumber + 1 : last.playoffHoleNumber;
}

function PlayoffFlow({ round }: { round: Round }) {
  const insets = useSafeAreaInsets();
  const setPlayoffHoleScore = useAppStore((s) => s.setPlayoffHoleScore);
  const [phase, setPhase] = useState<"entry" | "decision">("entry");
  // Buffered exactly like `displayedHole` for regulation holes — must only
  // advance when the user explicitly taps through, never react automatically
  // to a tied playoff hole's score being recalculated (which would otherwise
  // yank them straight to the next hole before they see the tied result).
  const [displayedPlayoffHole, setDisplayedPlayoffHole] = useState(() =>
    nextPlayoffHoleFrom(round.matchPlayResult?.playoffResults ?? [])
  );
  // Unlike regulation (where `round.currentHole` is a store-persisted pointer
  // that only moves via an explicit submit action), there's no stored
  // "frontier" for playoff holes — it's normally derived fresh from
  // `playoffResults`. But `playoffResults` recalculates live as soon as both
  // scores for a hole are entered, *before* the user taps Submit — so a
  // purely-derived frontier would advance out from under the "editing past
  // hole" check the instant the second score lands, hiding the Submit
  // button behind a phantom "Save & Return" state. Track it as local state
  // instead, seeded the same way at mount (so resuming mid-playoff still
  // works) but only ever advanced explicitly inside handleSubmit.
  const [frontierPlayoffHole, setFrontierPlayoffHole] = useState(() =>
    nextPlayoffHoleFrom(round.matchPlayResult?.playoffResults ?? [])
  );

  const sides = getRoundMatchPlaySides(round);
  const config = round.matchPlayConfig;
  const playoffResults = round.matchPlayResult?.playoffResults ?? [];
  const sourceHoleNumber = ((displayedPlayoffHole - 1) % round.holeCount) + 1;
  const sourceHole = round.holes.find((h) => h.number === sourceHoleNumber);

  const relativeHandicaps = useMemo(() => {
    if (!config || !sides) return {};
    const handicapPlayers = round.players.filter(
      (p) => sides.sideA.playerIds.includes(p.id) || sides.sideB.playerIds.includes(p.id)
    );
    return calculateRelativeMatchPlayHandicaps(handicapPlayers, round.holeCount, config.handicapAllowancePercent);
  }, [config, sides, round.players, round.holeCount]);

  if (!config || !sides || !sourceHole) return null;

  const challengesThisHole = getChallengesForHole(round, sourceHole.number);
  const playoffScores = round.matchPlayPlayoffScores ?? [];
  const isComplete = [...sides.sideA.playerIds, ...sides.sideB.playerIds].every((id) =>
    playoffScores.some((s) => s.playerId === id && s.holeNumber === displayedPlayoffHole && s.grossScore !== null)
  );
  const isEditingPastPlayoffHole = displayedPlayoffHole < frontierPlayoffHole;
  const thisHoleResult = playoffResults.find((p) => p.playoffHoleNumber === displayedPlayoffHole);

  const goToPlayoffHole = (holeNumber: number) => {
    setPhase("entry");
    setDisplayedPlayoffHole(holeNumber);
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    useAppStore.getState().submitPlayoffHole();

    if (isEditingPastPlayoffHole) {
      useToastStore.getState().showToast("Score saved");
      goToPlayoffHole(frontierPlayoffHole);
      return;
    }

    if (thisHoleResult?.winnerSideId) {
      const winnerName = thisHoleResult.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name;
      useToastStore.getState().showToast(`${winnerName} wins the playoff!`);
      // Deliberately don't advance the frontier here — see the comment on
      // frontierPlayoffHole above. The playoff is over regardless, so there's
      // no "next hole" for it to point to anyway.
      setPhase("decision");
    } else {
      useToastStore
        .getState()
        .showToast(`Playoff hole ${displayedPlayoffHole} tied — continues to hole ${displayedPlayoffHole + 1}`);
      setFrontierPlayoffHole(displayedPlayoffHole + 1);
      goToPlayoffHole(displayedPlayoffHole + 1);
    }
  };

  const showDecisionPanel = phase === "decision" && !isEditingPastPlayoffHole && !!thisHoleResult?.winnerSideId;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
      <HoleNavigator
        label="Playoff Hole"
        displayedNumber={displayedPlayoffHole}
        totalCount={frontierPlayoffHole}
        maxNavigable={frontierPlayoffHole}
        onBack={() => goToPlayoffHole(displayedPlayoffHole - 1)}
        onForward={() => goToPlayoffHole(displayedPlayoffHole + 1)}
      />
      <PlayoffBanner playoffHoleNumber={displayedPlayoffHole} />
      <HoleInfoCard
        holeNumber={sourceHole.number}
        par={sourceHole.par}
        strokeIndex={sourceHole.strokeIndex}
        headerRight={
          challengesThisHole.length > 0 ? (
            <ChallengeHoleBadges challenges={challengesThisHole} currency={round.currency} />
          ) : null
        }
      />

      {challengesThisHole.map((challenge) => (
        <ChallengeInfoRow
          key={challenge.id}
          challenge={challenge}
          currency={round.currency}
          onPressInfo={() => router.push(`/round/${round.id}/leaderboard?tab=challenges`)}
        />
      ))}

      <MatchPlayScoreRows
        round={round}
        hole={sourceHole}
        holeNumber={displayedPlayoffHole}
        sides={sides}
        relativeHandicaps={relativeHandicaps}
        scores={playoffScores}
        onChangeScore={(playerId, value) => setPlayoffHoleScore(playerId, displayedPlayoffHole, value)}
      />

      {!showDecisionPanel ? (
        <PrimaryButton
          label={isEditingPastPlayoffHole ? "Save & Return" : "Submit Hole"}
          onPress={handleSubmit}
          disabled={!isComplete}
          style={styles.actionButton}
        />
      ) : (
        <View style={styles.resultPanel}>
          <Text style={styles.resultTitle}>
            {thisHoleResult?.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name} wins the playoff
          </Text>
          <Text style={styles.resultSubtitle}>Match Complete</Text>
          <View style={styles.resultActions}>
            <PrimaryButton
              label="Finish Round"
              onPress={() => router.push(`/round/${round.id}/review`)}
              style={styles.resultButton}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  headerButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  holeNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  holeNavLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  scoreList: {
    marginTop: spacing.lg,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
  resultPanel: {
    marginTop: spacing.lg,
    backgroundColor: colors.light,
    borderRadius: 16,
    padding: spacing.lg,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
  },
  resultSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  resultButton: {
    flex: 1,
  },
  continueScoringButton: {
    marginTop: spacing.sm,
  },
  nassauSummary: {
    marginBottom: spacing.sm,
  },
  previewBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.light,
  },
  previewText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identity: {
    flexShrink: 1,
    gap: 4,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  net: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
