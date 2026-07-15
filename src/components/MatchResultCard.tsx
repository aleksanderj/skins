import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../constants/theme";
import { Card } from "./Card";

type Props = {
  winnerName: string | null;
  loserName: string | null;
  resultLabel: string;
  isHalved: boolean;
};

/** "Alex defeats Ben / 3 & 2", or "Match Halved" when there's no winner. */
export function MatchResultCard({ winnerName, loserName, resultLabel, isHalved }: Props) {
  return (
    <Card style={styles.card}>
      {isHalved || !winnerName ? (
        <Text style={styles.halved}>Match Halved</Text>
      ) : (
        <Text style={styles.summary}>
          {winnerName}
          {loserName ? <Text style={styles.defeats}> defeats </Text> : null}
          {loserName}
        </Text>
      )}
      <Text style={styles.result}>{resultLabel}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
  },
  summary: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  defeats: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  halved: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.warning,
  },
  result: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
});
