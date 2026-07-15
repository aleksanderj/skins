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
import { EmptyState } from "../../../src/components/EmptyState";
import { getPlayerBalances, isHoleComplete } from "../../../src/features/rounds/selectors";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../../../src/utils/handicap";
import { formatSignedCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing, touchTarget } from "../../../src/constants/theme";
import type { Round, SkinResult } from "../../../src/types";

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

  useEffect(() => {
    // Deep-linking to a specific hole (from Review's "edit" action) should win
    // over the normal "resume where you left off" sync.
    if (round && requestedHole === null) setDisplayedHole(round.currentHole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id]);

  const playingHandicaps = useMemo(() => {
    if (!round) return {};
    const map: Record<string, number> = {};
    round.players.forEach((p) => {
      map[p.id] = calculatePlayingHandicap(p.handicap, round.holeCount);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.players, round?.holeCount]);

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

  const hole = round.holes.find((h) => h.number === displayedHole);
  const balances = getPlayerBalances(round);
  const isComplete = isHoleComplete(round, displayedHole);
  const isFinalHole = displayedHole === round.holeCount;
  const isEditingPastHole = displayedHole < round.currentHole;
  const skinResult = round.skinResults.find((r) => r.holeNumber === displayedHole) ?? null;
  const isCarryoverHole = round.skinResults.some(
    (r) => r.holeNumber === displayedHole - 1 && r.carriedIntoNextHoleCents > 0
  );
  const skinsAtStake = isCarryoverHole
    ? 1 + (round.skinResults.find((r) => r.holeNumber === displayedHole - 1)?.carriedIntoNextHoleCents ?? 0) / round.stakePerSkinCents
    : 1;

  const handleSubmitHole = () => {
    setPhase("result");
  };

  const handleNextHole = () => {
    submitHole(displayedHole);
    setDisplayedHole(displayedHole + 1);
    setPhase("entry");
  };

  const handleReviewRound = () => {
    router.push(`/round/${round.id}/review`);
  };

  const handleBackToReview = () => {
    router.replace(`/round/${round.id}/review`);
  };

  const handleAbandon = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    abandonRound();
    setShowAbandonConfirm(false);
    router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title={round.courseName}
        subtitle={`Hole ${displayedHole} of ${round.holeCount}`}
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {hole ? (
          <SkinValueCard
            holeNumber={hole.number}
            par={hole.par}
            strokeIndex={hole.strokeIndex}
            skinsAtStake={skinsAtStake}
            stakePerSkinCents={round.stakePerSkinCents}
            currency={round.currency}
            isCarryover={isCarryoverHole}
          />
        ) : null}

        <View style={styles.scoreList}>
          {round.players.map((player, index) => {
            const scoreRecord = round.scores.find(
              (s) => s.playerId === player.id && s.holeNumber === displayedHole
            );
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
                showNet={round.scoringMode === "net"}
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
            onPress={handleSubmitHole}
            disabled={!isComplete}
            style={styles.actionButton}
            accessibilityHint={isComplete ? undefined : "Enter every player's score to continue"}
          />
        ) : (
          <View style={styles.resultPanel}>
            <ResultSummary
              skinResult={skinResult}
              round={round}
              displayedHole={displayedHole}
              isFinalHole={isFinalHole}
            />
            <View style={styles.resultActions}>
              <SecondaryButton label="Edit Scores" onPress={() => setPhase("entry")} style={styles.resultButton} />
              {isEditingPastHole ? (
                <PrimaryButton label="Back to Review" onPress={handleBackToReview} style={styles.resultButton} />
              ) : (
                <PrimaryButton
                  label={isFinalHole ? "Review Round" : "Next Hole"}
                  onPress={isFinalHole ? handleReviewRound : handleNextHole}
                  style={styles.resultButton}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

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

function ResultSummary({
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

  if (skinResult.winnerPlayerId) {
    const winner = round.players.find((p) => p.id === skinResult.winnerPlayerId);
    const impactCents = skinResult.skinsWon * round.stakePerSkinCents * (round.players.length - 1);
    return (
      <View>
        <Text style={styles.resultTitle}>
          {winner?.name ?? "A player"} wins {skinResult.skinsWon} skin{skinResult.skinsWon > 1 ? "s" : ""}
        </Text>
        <Text style={styles.resultSubtitle}>
          {formatSignedCurrency(impactCents, round.currency)} total impact
        </Text>
      </View>
    );
  }

  const skinsCarried = skinResult.carriedIntoNextHoleCents / round.stakePerSkinCents;

  if (!round.carryoversEnabled) {
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
});
