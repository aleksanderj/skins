import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { MatchResultCard } from "../../../src/components/MatchResultCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { ScorecardGrid } from "../../../src/features/rounds/ScorecardGrid";
import {
  getMatchPlaySideName,
  getPlayerBalances,
  getRoundMatchPlaySides,
  getUnresolvedCarryoverCents,
  isAwaitingPlayoff,
  isRoundReadyToComplete,
} from "../../../src/features/rounds/selectors";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import type { Round } from "../../../src/types";

export default function RoundReviewScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const completeRound = useAppStore((s) => s.completeRound);

  const round = activeRound && activeRound.id === roundId ? activeRound : null;

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

  const editHole = (holeNumber: number) => {
    router.push(`/round/${round.id}?hole=${holeNumber}`);
  };

  const handleComplete = () => {
    completeRound();
    router.replace(`/round/${round.id}/settlement`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Review Round" subtitle={round.courseName} onBack={() => router.back()} />

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
          <Text style={styles.sectionTitle}>{isMatchPlay ? "Balances" : "Skins & balances"}</Text>
          {balances.map((b) => {
            const player = round.players.find((p) => p.id === b.playerId);
            return (
              <View key={b.playerId} style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceName}>{player?.name}</Text>
                  {!isMatchPlay ? (
                    <Text style={styles.balanceSkins}>
                      {b.skinsWon ?? 0} skin{(b.skinsWon ?? 0) === 1 ? "" : "s"} won
                    </Text>
                  ) : null}
                </View>
                <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
              </View>
            );
          })}
        </Card>

        <PrimaryButton
          label="Complete Round"
          onPress={handleComplete}
          disabled={!ready}
          style={styles.completeButton}
          accessibilityHint={ready ? undefined : "Finish deciding the round first"}
        />
      </ScrollView>
    </View>
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
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
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
  completeButton: {
    marginTop: spacing.sm,
  },
});
