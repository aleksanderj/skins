import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { MoneyAmount } from "../../components/MoneyAmount";
import { colors, fontSize, spacing, touchTarget } from "../../constants/theme";
import { getRoundWinnerSummary } from "../rounds/selectors";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onPress: () => void;
};

export function RoundSummaryCard({ round, onPress }: Props) {
  const winner = getRoundWinnerSummary(round);
  const date = round.completedAt ?? round.createdAt;
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open results for round at ${round.courseName} on ${formattedDate}`}
      style={({ pressed }) => [pressed && styles.pressed, styles.touchable]}
    >
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.course} numberOfLines={1}>
            {round.courseName}
          </Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {round.players.length} players · {round.scoringMode === "net" ? "Net" : "Gross"} Skins ·{" "}
            {round.holeCount} holes
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.winnerLabel}>{winner.name ? "Winner" : "No skins won"}</Text>
            {winner.name ? (
              <Text style={styles.winnerName}>{winner.name}</Text>
            ) : (
              <Text style={styles.winnerName}>All square</Text>
            )}
          </View>
          <MoneyAmount cents={winner.balanceCents} currency={round.currency} size="lg" />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: touchTarget.min,
  },
  pressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  course: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: 4,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.md,
  },
  winnerLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  winnerName: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
});
