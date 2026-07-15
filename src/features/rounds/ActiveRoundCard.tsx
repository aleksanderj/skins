import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { HoleProgress } from "../../components/HoleProgress";
import { colors, fontSize, spacing } from "../../constants/theme";
import { getRoundWinnerSummary } from "./selectors";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onResume: () => void;
};

export function ActiveRoundCard({ round, onResume }: Props) {
  const leader = getRoundWinnerSummary(round);

  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>ROUND IN PROGRESS</Text>
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
          <Text style={styles.statLabel}>Leader</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {leader.name ?? "No skins yet"}
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
