import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { LeaderboardRow } from "../../../src/components/LeaderboardRow";
import { SettlementSummaryCard } from "../../../src/components/SettlementSummaryCard";
import { MatchResultCard } from "../../../src/components/MatchResultCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { ScorecardGrid } from "../../../src/features/rounds/ScorecardGrid";
import {
  getMatchPlaySideName,
  getPlayerBalances,
  getPlayerIndex,
  getPlayerName,
  getRoundMatchPlaySides,
  getSettlements,
} from "../../../src/features/rounds/selectors";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import { formatCurrency } from "../../../src/utils/currency";

export default function HistoryRoundDetailScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const round = useAppStore((s) => s.roundHistory.find((r) => r.id === roundId));

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Round" onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title="Round not found" message="This round may have been deleted." />
      </View>
    );
  }

  const balances = getPlayerBalances(round).sort((a, b) => b.balanceCents - a.balanceCents);
  const settlements = getSettlements(round);
  const totalPotCents = balances.reduce((sum, b) => sum + Math.max(b.balanceCents, 0), 0);
  const date = new Date(round.completedAt ?? round.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const isMatchPlay = round.format === "match_play";
  const sides = isMatchPlay ? getRoundMatchPlaySides(round) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title={round.courseName} subtitle={date} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <Text style={styles.meta}>
          {round.players.length} players ·{" "}
          {isMatchPlay
            ? `${round.matchPlayConfig?.scoringMode === "net" ? "Net" : "Gross"} Match Play`
            : `${round.skinsConfig?.scoringMode === "net" ? "Net" : "Gross"} Skins`}{" "}
          · {round.holeCount} holes ·{" "}
          {isMatchPlay
            ? `${formatCurrency(round.matchPlayConfig?.stakeCents ?? 0, round.currency)}/match`
            : `${formatCurrency(round.skinsConfig?.stakePerSkinCents ?? 0, round.currency)}/skin`}
        </Text>

        {isMatchPlay && sides ? (
          round.matchPlayResult?.structure === "nassau" ? (
            <View style={styles.card}>
              {(round.matchPlayResult.nassauMatches ?? []).map((match) => (
                <NassauStatusCard
                  key={match.segment}
                  title={match.segment === "front" ? "Front Nine" : match.segment === "back" ? "Back Nine" : "Overall"}
                  statusText=""
                  resultLabel={match.resultLabel}
                  winnerName={match.winnerSideId ? getMatchPlaySideName(round, match.winnerSideId) : null}
                  stakeCents={round.matchPlayConfig?.stakeCents ?? 0}
                  currency={round.currency}
                />
              ))}
            </View>
          ) : round.matchPlayResult?.singleMatch ? (
            <MatchResultCard
              winnerName={round.matchPlayResult.singleMatch.winnerSideId ? getMatchPlaySideName(round, round.matchPlayResult.singleMatch.winnerSideId) : null}
              loserName={
                round.matchPlayResult.singleMatch.winnerSideId
                  ? getMatchPlaySideName(
                      round,
                      round.matchPlayResult.singleMatch.winnerSideId === sides.sideA.id ? sides.sideB.id : sides.sideA.id
                    )
                  : null
              }
              resultLabel={round.matchPlayResult.singleMatch.resultLabel}
              isHalved={round.matchPlayResult.singleMatch.isHalved}
            />
          ) : null
        ) : null}

        <Card style={styles.card}>
          <ScorecardGrid round={round} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Final balances</Text>
          {balances.map((b, index) => (
            <LeaderboardRow
              key={b.playerId}
              rank={index + 1}
              name={getPlayerName(round, b.playerId)}
              index={index}
              skinsWon={b.skinsWon ?? 0}
              balanceCents={b.balanceCents}
              currency={round.currency}
            />
          ))}
        </Card>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Settlement</Text>
          {settlements.length === 0 ? (
            <Card>
              <Text style={styles.noSettlements}>No payments needed — everyone's square.</Text>
            </Card>
          ) : (
            <SettlementSummaryCard
              totalPotCents={totalPotCents}
              currency={round.currency}
              entries={settlements.map((s) => ({
                fromName: getPlayerName(round, s.fromPlayerId),
                toName: getPlayerName(round, s.toPlayerId),
                amountCents: s.amountCents,
                fromIndex: getPlayerIndex(round, s.fromPlayerId),
              }))}
            />
          )}
        </View>
      </ScrollView>
    </View>
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
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noSettlements: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
