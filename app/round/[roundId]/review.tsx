import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { IconCircleButton } from "../../../src/components/IconCircleButton";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { PlayerAvatar } from "../../../src/components/PlayerAvatar";
import { MatchResultCard } from "../../../src/components/MatchResultCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { ConfirmationModal } from "../../../src/components/ConfirmationModal";
import { EmptyState } from "../../../src/components/EmptyState";
import { ScorecardGrid } from "../../../src/features/rounds/ScorecardGrid";
import { ChallengeResultRow } from "../../../src/features/challenges/ChallengeResultRow";
import {
  getChallenges,
  getMatchPlaySideName,
  getPlayerBalances,
  getPlayerName,
  getRoundMatchPlaySides,
  getUnresolvedCarryoverCents,
  isAwaitingPlayoff,
  isRoundReadyToComplete,
} from "../../../src/features/rounds/selectors";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, radius, spacing } from "../../../src/constants/theme";
import type { Round } from "../../../src/types";

export default function RoundReviewScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const completeRound = useAppStore((s) => s.completeRound);
  const abandonRound = useAppStore((s) => s.abandonRound);

  const round = activeRound && activeRound.id === roundId ? activeRound : null;
  const [showMenu, setShowMenu] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Review" onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title="No active round" />
      </View>
    );
  }

  const ready = isRoundReadyToComplete(round);
  const unresolvedCarryoverCents = getUnresolvedCarryoverCents(round);
  const awaitingPlayoff = isAwaitingPlayoff(round);
  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);
  const isMatchPlay = round.format === "match_play";
  const sides = isMatchPlay ? getRoundMatchPlaySides(round) : null;
  const challenges = getChallenges(round);
  const scoringModeLabel = isMatchPlay
    ? round.matchPlayConfig?.scoringMode === "net"
      ? "Net"
      : "Gross"
    : round.skinsConfig?.scoringMode === "net"
      ? "Net"
      : "Gross";
  const balancesSubtitle = isMatchPlay
    ? `${scoringModeLabel} Match Play`
    : `Based on ${round.holeCount} holes · ${scoringModeLabel} Skins`;

  const editHole = (holeNumber: number) => {
    router.push(`/round/${round.id}?hole=${holeNumber}`);
  };

  const handleComplete = () => {
    completeRound();
    router.replace(`/round/${round.id}/settlement`);
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
        title="Review Round"
        titleIcon="flag"
        subtitle={round.courseName}
        subtitleIcon="location-outline"
        onBack={() => router.back()}
        right={<IconCircleButton icon="settings-outline" onPress={() => setShowMenu(true)} accessibilityLabel="Round options" />}
      />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        {!ready && !awaitingPlayoff ? (
          <Card style={StyleSheet.flatten([styles.card, styles.warningCard])}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              {isMatchPlay
                ? "This match isn't decided yet. Keep entering scores until it's won, halved, or a playoff is resolved."
                : "Some holes are missing scores. Complete every hole before finishing the round."}
            </Text>
          </Card>
        ) : null}

        {awaitingPlayoff ? (
          <Card style={StyleSheet.flatten([styles.card, styles.warningCard])}>
            <Ionicons name="flash" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Regulation ended all square — resume the round to play the sudden-death playoff.
            </Text>
          </Card>
        ) : null}

        {unresolvedCarryoverCents > 0 ? (
          <Card style={StyleSheet.flatten([styles.card, styles.warningCard])}>
            <Ionicons name="repeat" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              {formatCurrency(unresolvedCarryoverCents, round.currency)} in carried skins went unresolved —
              the final hole tied.
            </Text>
          </Card>
        ) : null}

        {isMatchPlay && sides ? <MatchPlaySummarySection round={round} sides={sides} /> : null}

        <Card style={styles.card}>
          <ScorecardGrid round={round} onEditHole={editHole} />
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="trophy" size={20} color={colors.primaryDark} />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{isMatchPlay ? "Balances" : "Skins & balances"}</Text>
              <Text style={styles.sectionSubtitle}>{balancesSubtitle}</Text>
            </View>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          </View>
          {balances.map((b, index) => {
            const player = round.players.find((p) => p.id === b.playerId);
            return (
              <View key={b.playerId} style={styles.balanceRow}>
                <View style={styles.balanceIdentity}>
                  <PlayerAvatar name={player?.name ?? "?"} index={index} size={36} singleInitial />
                  <View>
                    <Text style={styles.balanceName}>{player?.name}</Text>
                    {!isMatchPlay ? (
                      <Text style={styles.balanceSkins}>
                        {b.skinsWon ?? 0} skin{(b.skinsWon ?? 0) === 1 ? "" : "s"} won
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.balancePill, b.balanceCents < 0 && styles.balancePillNegative]}>
                  <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
                </View>
              </View>
            );
          })}
        </Card>

        {challenges.length > 0 ? (
          <View style={styles.challengesSection}>
            {challenges.map((challenge) => (
              <ChallengeResultRow
                key={challenge.id}
                challenge={challenge}
                hole={round.holes.find((h) => h.number === challenge.holeNumber)}
                winnerName={challenge.winnerPlayerId ? getPlayerName(round, challenge.winnerPlayerId) : null}
                currency={round.currency}
              />
            ))}
          </View>
        ) : null}

        <CompleteRoundButton
          onPress={handleComplete}
          disabled={!ready}
          accessibilityHint={ready ? undefined : "Finish deciding the round first"}
        />
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

function CompleteRoundButton({
  onPress,
  disabled,
  accessibilityHint,
}: {
  onPress: () => void;
  disabled: boolean;
  accessibilityHint?: string;
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.completeButton,
        disabled ? styles.completeButtonDisabled : null,
        pressed && !disabled ? styles.completeButtonPressed : null,
      ]}
    >
      <Ionicons name="flag" size={22} color={disabled ? colors.disabled : colors.white} />
      <View style={styles.completeButtonText}>
        <Text style={[styles.completeButtonTitle, disabled && styles.completeButtonTitleDisabled]} numberOfLines={1}>
          Complete Round
        </Text>
        <Text style={[styles.completeButtonSubtitle, disabled && styles.completeButtonTitleDisabled]} numberOfLines={1}>
          Lock scores and calculate results
        </Text>
      </View>
    </Pressable>
  );
}

function MatchPlaySummarySection({
  round,
  sides,
}: {
  round: Round;
  sides: NonNullable<ReturnType<typeof getRoundMatchPlaySides>>;
}) {
  const result = round.matchPlayResult;
  const stakeCents = round.matchPlayConfig?.stakeCents ?? 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Match progression</Text>
      <Text style={styles.stakeText}>Stake: {formatCurrency(stakeCents, round.currency)}{round.matchPlayConfig?.structure === "nassau" ? " per match" : ""}</Text>

      {result?.structure === "nassau" ? (
        <View style={styles.nassauWrapper}>
          {(result.nassauMatches ?? []).map((match) => (
            <NassauStatusCard
              key={match.segment}
              title={match.segment === "front" ? "Front Nine" : match.segment === "back" ? "Back Nine" : "Overall"}
              statusText={match.status === 0 ? "All Square" : ""}
              resultLabel={match.resultLabel}
              winnerName={match.winnerSideId ? getMatchPlaySideName(round, match.winnerSideId) : null}
              stakeCents={stakeCents}
              currency={round.currency}
            />
          ))}
        </View>
      ) : result?.singleMatch ? (
        <View style={styles.matchResultWrapper}>
          <MatchResultCard
            winnerName={result.singleMatch.winnerSideId ? getMatchPlaySideName(round, result.singleMatch.winnerSideId) : null}
            loserName={
              result.singleMatch.winnerSideId
                ? getMatchPlaySideName(
                    round,
                    result.singleMatch.winnerSideId === sides.sideA.id ? sides.sideB.id : sides.sideA.id
                  )
                : null
            }
            resultLabel={result.singleMatch.resultLabel}
            isHalved={result.singleMatch.isHalved}
          />
          {result.playoffResults && result.playoffResults.length > 0 ? (
            <Text style={styles.playoffNote}>
              Decided in a sudden-death playoff ({result.playoffResults.length} hole
              {result.playoffResults.length > 1 ? "s" : ""}).
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FCF3E1",
    borderColor: colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stakeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  nassauWrapper: {
    marginTop: spacing.xs,
  },
  matchResultWrapper: {
    marginTop: spacing.xs,
  },
  playoffNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  balanceName: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  balanceSkins: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balancePill: {
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  balancePillNegative: {
    backgroundColor: "rgba(217,83,79,0.12)",
  },
  challengesSection: {
    marginBottom: spacing.md,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  completeButtonPressed: {
    opacity: 0.85,
  },
  completeButtonDisabled: {
    backgroundColor: colors.border,
  },
  completeButtonText: {
    alignItems: "center",
  },
  completeButtonTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "800",
    textAlign: "center",
  },
  completeButtonSubtitle: {
    color: colors.light,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: "center",
  },
  completeButtonTitleDisabled: {
    color: colors.disabled,
  },
});
