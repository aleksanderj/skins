import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { LeaderboardRow } from "../../../src/components/LeaderboardRow";
import { SettlementCard } from "../../../src/components/SettlementCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { getPlayerBalances, getPlayerName, getSettlements } from "../../../src/features/rounds/selectors";
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
  const date = new Date(round.completedAt ?? round.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title={round.courseName} subtitle={date} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>
          {round.players.length} players · {round.scoringMode === "net" ? "Net" : "Gross"} Skins ·{" "}
          {round.holeCount} holes · {formatCurrency(round.stakePerSkinCents, round.currency)}/skin
        </Text>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Final balances</Text>
          {balances.map((b, index) => (
            <LeaderboardRow
              key={b.playerId}
              rank={index + 1}
              name={getPlayerName(round, b.playerId)}
              index={index}
              skinsWon={b.skinsWon}
              balanceCents={b.balanceCents}
              currency={round.currency}
            />
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Settlement</Text>
          {settlements.length === 0 ? (
            <Text style={styles.noSettlements}>No payments needed — everyone's square.</Text>
          ) : (
            settlements.map((s, i) => (
              <SettlementCard
                key={`${s.fromPlayerId}-${s.toPlayerId}-${i}`}
                fromName={getPlayerName(round, s.fromPlayerId)}
                toName={getPlayerName(round, s.toPlayerId)}
                amountCents={s.amountCents}
                currency={round.currency}
              />
            ))
          )}
        </Card>
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
