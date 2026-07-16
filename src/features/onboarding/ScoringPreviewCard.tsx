import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../../constants/theme";
import { PlayerAvatar } from "../../components/PlayerAvatar";
import { Card } from "../../components/Card";

const PREVIEW_PLAYERS = [
  { name: "Alex", score: 4 },
  { name: "Ben", score: 5 },
  { name: "Chris", score: 4 },
];

/** Static "Automatic Scoring" mockup for onboarding — illustrative only, not wired to real round data. */
export function ScoringPreviewCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.holeHeader}>
        <Text style={styles.holeLabel}>HOLE 5</Text>
        <Text style={styles.holeDetail}>Par 4</Text>
      </View>
      {PREVIEW_PLAYERS.map((player, index) => (
        <View key={player.name} style={styles.row}>
          <View style={styles.identity}>
            <PlayerAvatar name={player.name} index={index} size={30} />
            <Text style={styles.name}>{player.name}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{player.score}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  holeHeader: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  holeLabel: {
    color: colors.light,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1,
  },
  holeDetail: {
    color: colors.light,
    fontSize: fontSize.xs,
    opacity: 0.85,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  scoreBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
});
