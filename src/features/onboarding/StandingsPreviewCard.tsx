import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../../constants/theme";
import { Card } from "../../components/Card";
import { LeaderboardRow } from "../../components/LeaderboardRow";

const PREVIEW_STANDINGS = [
  { name: "You", skinsWon: 2, balanceCents: 4500 },
  { name: "Blake", skinsWon: 1, balanceCents: 500 },
  { name: "Sam", skinsWon: 1, balanceCents: -1500 },
];

/** Static "Live Standings" mockup for onboarding — illustrative only, not wired to real round data. */
export function StandingsPreviewCard() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Skins Game</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>
      {PREVIEW_STANDINGS.map((player, index) => (
        <LeaderboardRow
          key={player.name}
          rank={index + 1}
          name={player.name}
          index={index}
          skinsWon={player.skinsWon}
          balanceCents={player.balanceCents}
          currency="USD"
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.positive,
  },
  liveText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.positive,
  },
});
