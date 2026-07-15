import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { MoneyAmount } from "../../components/MoneyAmount";
import { colors, fontSize, spacing, touchTarget } from "../../constants/theme";
import { getMatchPlayResultSummary, getRoundWinnerSummary } from "../rounds/selectors";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onPress: () => void;
};

export function RoundSummaryCard({ round, onPress }: Props) {
  const date = round.completedAt ?? round.createdAt;
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isMatchPlay = round.format === "match_play";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open results for round at ${round.courseName} on ${formattedDate}`}
      style={({ pressed }) => [pressed && styles.pressed, styles.touchable]}
    >
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.badge, isMatchPlay && styles.badgeMatchPlay]}>
              <Text style={[styles.badgeText, isMatchPlay && styles.badgeTextMatchPlay]}>
                {isMatchPlay ? "MATCH PLAY" : "SKINS"}
              </Text>
            </View>
            <Text style={styles.course} numberOfLines={1}>
              {round.courseName}
            </Text>
          </View>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {round.players.length} players ·{" "}
            {isMatchPlay ? (round.matchPlayConfig?.scoringMode === "net" ? "Net" : "Gross") : round.skinsConfig?.scoringMode === "net" ? "Net" : "Gross"}{" "}
            {isMatchPlay ? "Match Play" : "Skins"} · {round.holeCount} holes
          </Text>
        </View>

        {isMatchPlay ? <MatchPlayFooter round={round} /> : <SkinsFooter round={round} />}
      </Card>
    </Pressable>
  );
}

function SkinsFooter({ round }: { round: Round }) {
  const winner = getRoundWinnerSummary(round);
  return (
    <View style={styles.footerRow}>
      <View>
        <Text style={styles.winnerLabel}>{winner.name ? "Winner" : "No skins won"}</Text>
        <Text style={styles.winnerName}>{winner.name ?? "All square"}</Text>
      </View>
      <MoneyAmount cents={winner.balanceCents} currency={round.currency} size="lg" />
    </View>
  );
}

function MatchPlayFooter({ round }: { round: Round }) {
  const summary = getMatchPlayResultSummary(round);
  return (
    <View style={styles.footerRowStacked}>
      <Text style={styles.winnerName}>{summary.title}</Text>
      {summary.subtitle ? <Text style={styles.matchSubtitle}>{summary.subtitle}</Text> : null}
    </View>
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
  headerLeft: {
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgeMatchPlay: {
    backgroundColor: "#FCF3E1",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.primaryDark,
  },
  badgeTextMatchPlay: {
    color: colors.warning,
  },
  course: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
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
  footerRowStacked: {
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
  matchSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primaryDark,
    marginTop: 2,
  },
});
