import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { Card } from "./Card";

type Props = {
  /** e.g. "Alex 2 Up", "All Square", "Team Pine wins 3 & 2" */
  headline: string;
  /** e.g. "Through 11", "Dormie — 2 to play", "Match Complete" */
  subline: string;
  isDormie?: boolean;
  isComplete?: boolean;
};

export function MatchStatusCard({ headline, subline, isDormie, isComplete }: Props) {
  return (
    <Card style={StyleSheet.flatten([styles.card, isComplete && styles.cardComplete])}>
      {isDormie ? (
        <View style={styles.badge}>
          <Ionicons name="alert-circle" size={14} color={colors.warning} />
          <Text style={styles.badgeText}>DORMIE</Text>
        </View>
      ) : isComplete ? (
        <View style={[styles.badge, styles.badgeComplete]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.positive} />
          <Text style={[styles.badgeText, styles.badgeTextComplete]}>MATCH COMPLETE</Text>
        </View>
      ) : null}
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subline}>{subline}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderWidth: 0,
    paddingVertical: spacing.xl,
  },
  cardComplete: {
    backgroundColor: colors.accent,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(197,138,24,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeComplete: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badgeText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  badgeTextComplete: {
    color: colors.white,
  },
  headline: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    textAlign: "center",
  },
  subline: {
    color: colors.light,
    fontSize: fontSize.sm,
    marginTop: 4,
    textAlign: "center",
  },
});
