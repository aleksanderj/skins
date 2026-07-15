import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { SegmentedControl } from "../../../src/components/SegmentedControl";
import { LeaderboardRow } from "../../../src/components/LeaderboardRow";
import { EmptyState } from "../../../src/components/EmptyState";
import { Ionicons } from "@expo/vector-icons";
import { getPlayerBalances, getPlayerName } from "../../../src/features/rounds/selectors";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing } from "../../../src/constants/theme";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const round = activeRound && activeRound.id === roundId ? activeRound : null;
  const [view, setView] = useState<"balances" | "skins">("balances");

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Leaderboard" onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title="No active round" />
      </View>
    );
  }

  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Leaderboard" subtitle={round.courseName} onBack={() => router.back()} />

      <View style={styles.segmentWrapper}>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "balances", label: "Balances" },
            { value: "skins", label: "Skins" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {view === "balances" ? (
          <Card>
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
        ) : round.skinResults.length === 0 ? (
          <EmptyState icon="flag-outline" title="No holes submitted yet" message="Skin outcomes will appear here hole by hole." />
        ) : (
          <Card padded={false}>
            {round.skinResults.map((result) => (
              <View key={result.holeNumber} style={styles.skinRow}>
                <View style={styles.skinHoleBadge}>
                  <Text style={styles.skinHoleNumber}>{result.holeNumber}</Text>
                </View>
                <View style={styles.skinInfo}>
                  {result.winnerPlayerId ? (
                    <Text style={styles.skinWinner}>{getPlayerName(round, result.winnerPlayerId)}</Text>
                  ) : (
                    <Text style={styles.skinTied}>Tied</Text>
                  )}
                  <Text style={styles.skinMeta}>
                    {result.skinsWon > 0
                      ? `${result.skinsWon} skin${result.skinsWon > 1 ? "s" : ""} · ${formatCurrency(result.monetaryValueCents, round.currency)}`
                      : result.carriedIntoNextHoleCents > 0
                        ? "Carried forward"
                        : "No skin awarded"}
                  </Text>
                </View>
                {result.carriedIntoNextHoleCents > 0 ? (
                  <Ionicons name="repeat" size={18} color={colors.warning} />
                ) : null}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  scroll: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  skinRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skinHoleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  skinHoleNumber: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  skinInfo: {
    flex: 1,
  },
  skinWinner: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  skinTied: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.warning,
  },
  skinMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
