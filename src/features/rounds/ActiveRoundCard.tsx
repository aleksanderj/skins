import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { HoleProgress } from "../../components/HoleProgress";
import { PlayerAvatar } from "../../components/PlayerAvatar";
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
          <Text style={styles.statLabel}>{isMatchPlay ? "Status" : "Leader"}</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {statusText || "All Square"}
          </Text>
        </View>
      </View>

      <Text style={styles.playersLabel}>{round.players.length} PLAYERS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playersRow}
      >
        {round.players.map((player, index) => (
          <View key={player.id} style={styles.playerItem}>
            <PlayerAvatar name={player.name} index={index} size={48} />
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      <PrimaryButton label="View Round" onPress={onResume} style={styles.button} />
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
  playersLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  playersRow: {
    gap: spacing.lg,
    paddingRight: spacing.sm,
  },
  playerItem: {
    alignItems: "center",
    width: 64,
  },
  playerName: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.lg,
  },
});
