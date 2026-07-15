import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { HoleProgress } from "../../components/HoleProgress";
import { colors, fontSize, spacing } from "../../constants/theme";
import { getMatchPlayStatusHeadline, getRoundWinnerSummary } from "./selectors";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onResume: () => void;
};

export function ActiveRoundCard({ round, onResume }: Props) {
  const isMatchPlay = round.format === "match_play";
  const leader = getRoundWinnerSummary(round);
  const statusText = isMatchPlay ? getMatchPlayStatusHeadline(round) : (leader.name ?? "No skins yet");

  return (
    <Card style={styles.card}>
      <View style={styles.badgeRow}>
        <Text style={styles.eyebrow}>{isMatchPlay ? "MATCH PLAY" : "SKINS"} IN PROGRESS</Text>
      </View>
      <Text style={styles.course}>{round.courseName}</Text>

      <View style={styles.progressRow}>
        <HoleProgress currentHole={round.currentHole} holeCount={round.holeCount} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Players</Text>
          <Text style={styles.statValue}>{round.players.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{isMatchPlay ? "Status" : "Leader"}</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {statusText || "All Square"}
          </Text>
        </View>
      </View>

      <PrimaryButton label="Resume Round" onPress={onResume} style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
  },
  course: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  progressRow: {
    marginTop: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  stat: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  button: {
    marginTop: spacing.lg,
  },
});
