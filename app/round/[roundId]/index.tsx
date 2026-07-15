import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SecondaryButton } from "../../../src/components/SecondaryButton";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";
import { SkinValueCard } from "../../../src/components/SkinValueCard";
import { PlayerScoreRow } from "../../../src/components/PlayerScoreRow";
import { MatchStatusCard } from "../../../src/components/MatchStatusCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { TeamBadge } from "../../../src/components/TeamBadge";
import { HandicapStrokeBadge } from "../../../src/components/HandicapStrokeBadge";
import { PlayoffBanner } from "../../../src/components/PlayoffBanner";
import { ScoreStepper } from "../../../src/components/ScoreStepper";
import { EmptyState } from "../../../src/components/EmptyState";
import {
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
import type { MatchPlayPlayoffResult, MatchPlaySide, Round, SkinResult } from "../../../src/types";

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
  const [phase, setPhase] = useState<"entry" | "result">("entry");
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title={round.courseName}
        subtitle={playoffActive ? matchLabel : `Hole ${displayedHole} of ${round.holeCount}`}
        onBack={() => router.replace("/")}
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push(`/round/${round.id}/leaderboard`)}
              accessibilityRole="button"
              accessibilityLabel="View leaderboard"
              style={styles.headerButton}
              hitSlop={4}
            >
              <Ionicons name="stats-chart" size={22} color={colors.text} />
            </Pressable>
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
          phase={phase}
          setPhase={setPhase}
          setDisplayedHole={setDisplayedHole}
          onStartPlayoff={() => {
            useAppStore.getState().startMatchPlayPlayoff();
            setPlayoffModeEntered(true);
          }}
        />
      ) : (
        <SkinsFlow
          round={round}
          displayedHole={displayedHole}
          phase={phase}
          setPhase={setPhase}
          setDisplayedHole={setDisplayedHole}
          setHoleScore={setHoleScore}
          submitHole={submitHole}
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
// Skins
// ---------------------------------------------------------------------------

function SkinsFlow({
  round,
  displayedHole,
  phase,
  setPhase,
  setDisplayedHole,
  setHoleScore,
  submitHole,
}: {
  round: Round;
  displayedHole: number;
  phase: "entry" | "result";
  setPhase: (p: "entry" | "result") => void;
  setDisplayedHole: (h: number) => void;
  setHoleScore: (playerId: string, holeNumber: number, grossScore: number | null) => void;
  submitHole: (holeNumber: number) => void;
}) {
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
  const skinResult = skinResults.find((r) => r.holeNumber === displayedHole) ?? null;
  const isCarryoverHole = skinResults.some(
    (r) => r.holeNumber === displayedHole - 1 && r.carriedIntoNextHoleCents > 0
  );
  const stakePerSkinCents = round.skinsConfig?.stakePerSkinCents ?? 0;
  const skinsAtStake = isCarryoverHole
    ? 1 + (skinResults.find((r) => r.holeNumber === displayedHole - 1)?.carriedIntoNextHoleCents ?? 0) / stakePerSkinCents
    : 1;

  const handleNextHole = () => {
    submitHole(displayedHole);
    setDisplayedHole(displayedHole + 1);
    setPhase("entry");
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {hole ? (
        <SkinValueCard
          holeNumber={hole.number}
          par={hole.par}
          strokeIndex={hole.strokeIndex}
          skinsAtStake={skinsAtStake}
          stakePerSkinCents={stakePerSkinCents}
          currency={round.currency}
          isCarryover={isCarryoverHole}
        />
      ) : null}

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

      {phase === "entry" ? (
        <PrimaryButton
          label="Submit Hole"
          onPress={() => setPhase("result")}
          disabled={!isComplete}
          style={styles.actionButton}
          accessibilityHint={isComplete ? undefined : "Enter every player's score to continue"}
        />
      ) : (
        <View style={styles.resultPanel}>
          <SkinsResultSummary skinResult={skinResult} round={round} displayedHole={displayedHole} isFinalHole={isFinalHole} />
          <View style={styles.resultActions}>
            <SecondaryButton label="Edit Scores" onPress={() => setPhase("entry")} style={styles.resultButton} />
            {isEditingPastHole ? (
              <PrimaryButton
                label="Back to Review"
                onPress={() => router.replace(`/round/${round.id}/review`)}
                style={styles.resultButton}
              />
            ) : (
              <PrimaryButton
                label={isFinalHole ? "Review Round" : "Next Hole"}
                onPress={isFinalHole ? () => router.push(`/round/${round.id}/review`) : handleNextHole}
                style={styles.resultButton}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SkinsResultSummary({
  skinResult,
  round,
  displayedHole,
  isFinalHole,
}: {
  skinResult: SkinResult | null;
  round: Round;
  displayedHole: number;
  isFinalHole: boolean;
}) {
  if (!skinResult) return null;
  const stakePerSkinCents = round.skinsConfig?.stakePerSkinCents ?? 0;

  if (skinResult.winnerPlayerId) {
    const winner = round.players.find((p) => p.id === skinResult.winnerPlayerId);
    const impactCents = skinResult.skinsWon * stakePerSkinCents * (round.players.length - 1);
    return (
      <View>
        <Text style={styles.resultTitle}>
          {winner?.name ?? "A player"} wins {skinResult.skinsWon} skin{skinResult.skinsWon > 1 ? "s" : ""}
        </Text>
        <Text style={styles.resultSubtitle}>{formatSignedCurrency(impactCents, round.currency)} total impact</Text>
      </View>
    );
  }

  const skinsCarried = skinResult.carriedIntoNextHoleCents / stakePerSkinCents;

  if (!round.skinsConfig?.carryoversEnabled) {
    return (
      <View>
        <Text style={styles.resultTitle}>Hole tied</Text>
        <Text style={styles.resultSubtitle}>No skin awarded this hole</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.resultTitle}>Hole tied</Text>
      <Text style={styles.resultSubtitle}>
        {isFinalHole
          ? `${skinsCarried} skin${skinsCarried > 1 ? "s" : ""} unresolved — no next hole`
          : `${skinsCarried} skin${skinsCarried > 1 ? "s" : ""} carry to Hole ${displayedHole + 1}`}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Match Play (regulation, single match or Nassau)
// ---------------------------------------------------------------------------

function MatchPlayFlow({
  round,
  displayedHole,
  phase,
  setPhase,
  setDisplayedHole,
  onStartPlayoff,
}: {
  round: Round;
  displayedHole: number;
  phase: "entry" | "result";
  setPhase: (p: "entry" | "result") => void;
  setDisplayedHole: (h: number) => void;
  onStartPlayoff: () => void;
}) {
  const setHoleScore = useAppStore((s) => s.setHoleScore);
  const config = round.matchPlayConfig;
  const sides = getRoundMatchPlaySides(round);

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
  const isFinalHole = displayedHole === round.holeCount;
  const isEditingPastHole = displayedHole < round.currentHole;
  const decided = isMatchPlayDecided(round);
  const awaitingPlayoffStart = isAwaitingPlayoff(round);

  const handleNextHole = () => {
    useAppStore.getState().submitMatchPlayHole(displayedHole);
    setDisplayedHole(displayedHole + 1);
    setPhase("entry");
  };

  const singleMatch = round.matchPlayResult?.structure === "single_match" ? round.matchPlayResult.singleMatch : undefined;
  const lastHoleResult = singleMatch?.holeResults[singleMatch.holeResults.length - 1];

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
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
        <View style={styles.holeCard}>
          <Text style={styles.holeCardLabel}>HOLE {hole.number}</Text>
          <Text style={styles.holeCardDetail}>
            Par {hole.par} · Stroke Index {hole.strokeIndex}
          </Text>
        </View>
      ) : null}

      <MatchPlayScoreRows
        round={round}
        hole={hole}
        holeNumber={displayedHole}
        sides={sides}
        relativeHandicaps={relativeHandicaps}
        scores={round.scores}
        onChangeScore={(playerId, value) => setHoleScore(playerId, displayedHole, value)}
      />

      {phase === "entry" ? (
        <PrimaryButton
          label="Submit Hole"
          onPress={() => setPhase("result")}
          disabled={!isComplete}
          style={styles.actionButton}
          accessibilityHint={isComplete ? undefined : "Enter every player's score to continue"}
        />
      ) : (
        <View style={styles.resultPanel}>
          <MatchPlayResultSummary round={round} sides={sides} displayedHole={displayedHole} />
          <View style={styles.resultActions}>
            <SecondaryButton label="Edit Scores" onPress={() => setPhase("entry")} style={styles.resultButton} />
            {isEditingPastHole ? (
              <PrimaryButton
                label="Back to Review"
                onPress={() => router.replace(`/round/${round.id}/review`)}
                style={styles.resultButton}
              />
            ) : decided ? (
              <PrimaryButton
                label="Finish Round"
                onPress={() => router.push(`/round/${round.id}/review`)}
                style={styles.resultButton}
              />
            ) : awaitingPlayoffStart ? (
              <PrimaryButton label="Start Playoff" onPress={onStartPlayoff} style={styles.resultButton} />
            ) : (
              <PrimaryButton
                label={isFinalHole ? "Review Round" : "Next Hole"}
                onPress={isFinalHole ? () => router.push(`/round/${round.id}/review`) : handleNextHole}
                style={styles.resultButton}
              />
            )}
          </View>
          {!isEditingPastHole && decided ? (
            <SecondaryButton
              label="Continue Scoring for Scorecard"
              onPress={handleNextHole}
              style={styles.continueScoringButton}
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function statusHeadline(status: number, sideAName: string, sideBName: string): string {
  if (status === 0) return "All Square";
  const leader = status > 0 ? sideAName : sideBName;
  return `${leader} ${Math.abs(status)} Up`;
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

    return (
      <View key={playerId} style={rowStyles.row}>
        <View style={rowStyles.identity}>
          {config.mode === "team" ? <TeamBadge name={side === "A" ? sides.sideA.name : sides.sideB.name} side={side} /> : null}
          <Text style={rowStyles.name}>{player.name}</Text>
          {showNet ? <HandicapStrokeBadge strokes={strokes} /> : null}
          {showNet && netScore !== null ? <Text style={rowStyles.net}>Net {netScore}</Text> : null}
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
  const setPlayoffHoleScore = useAppStore((s) => s.setPlayoffHoleScore);
  const [phase, setPhase] = useState<"entry" | "result">("entry");
  // Buffered exactly like `displayedHole` for regulation holes — must only
  // advance when the user explicitly taps through, never react automatically
  // to a tied playoff hole's score being recalculated (which would otherwise
  // yank them straight to the next hole before they see the tied result).
  const [displayedPlayoffHole, setDisplayedPlayoffHole] = useState(() =>
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

  const playoffScores = round.matchPlayPlayoffScores ?? [];
  const isComplete = [...sides.sideA.playerIds, ...sides.sideB.playerIds].every((id) =>
    playoffScores.some((s) => s.playerId === id && s.holeNumber === displayedPlayoffHole && s.grossScore !== null)
  );
  const thisHoleResult = playoffResults.find((p) => p.playoffHoleNumber === displayedPlayoffHole);

  const handleNextPlayoffHole = () => {
    useAppStore.getState().submitPlayoffHole();
    setDisplayedPlayoffHole(displayedPlayoffHole + 1);
    setPhase("entry");
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <PlayoffBanner playoffHoleNumber={displayedPlayoffHole} />
      <View style={styles.holeCard}>
        <Text style={styles.holeCardLabel}>HOLE {sourceHole.number}</Text>
        <Text style={styles.holeCardDetail}>
          Par {sourceHole.par} · Stroke Index {sourceHole.strokeIndex}
        </Text>
      </View>

      <MatchPlayScoreRows
        round={round}
        hole={sourceHole}
        holeNumber={displayedPlayoffHole}
        sides={sides}
        relativeHandicaps={relativeHandicaps}
        scores={playoffScores}
        onChangeScore={(playerId, value) => setPlayoffHoleScore(playerId, displayedPlayoffHole, value)}
      />

      {phase === "entry" ? (
        <PrimaryButton
          label="Submit Hole"
          onPress={() => setPhase("result")}
          disabled={!isComplete}
          style={styles.actionButton}
        />
      ) : (
        <View style={styles.resultPanel}>
          {thisHoleResult?.winnerSideId ? (
            <View>
              <Text style={styles.resultTitle}>
                {thisHoleResult.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name} wins the playoff
              </Text>
              <Text style={styles.resultSubtitle}>Match Complete</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resultTitle}>Playoff Hole Tied</Text>
              <Text style={styles.resultSubtitle}>Continues to Playoff Hole {displayedPlayoffHole + 1}</Text>
            </View>
          )}
          <View style={styles.resultActions}>
            <SecondaryButton label="Edit Scores" onPress={() => setPhase("entry")} style={styles.resultButton} />
            <PrimaryButton
              label={thisHoleResult?.winnerSideId ? "Finish Round" : `Playoff Hole ${displayedPlayoffHole + 1}`}
              onPress={() => {
                if (thisHoleResult?.winnerSideId) {
                  router.push(`/round/${round.id}/review`);
                } else {
                  handleNextPlayoffHole();
                }
              }}
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
  holeCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  holeCardLabel: {
    color: colors.light,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1,
  },
  holeCardDetail: {
    color: colors.light,
    fontSize: fontSize.sm,
    marginTop: 4,
    opacity: 0.85,
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
