import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import { formatCurrency } from "../../utils/currency";
import { getChallengeTypeIcon, getChallengeTypeLabel } from "./challengeMeta";
import type { Challenge, CurrencyCode } from "../../types";

type Props = {
  challenge: Challenge;
  currency: CurrencyCode;
  onPressInfo: () => void;
};

/** Read-only summary of a challenge riding on the hole currently being scored. Winner selection still happens on the Leaderboard's Challenges tab — "Challenge info" links there rather than duplicating that UI here. */
export function ChallengeInfoRow({ challenge, currency, onPressInfo }: Props) {
  const label = getChallengeTypeLabel(challenge.type);

  return (
    <Card style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={getChallengeTypeIcon(challenge.type)} size={18} color={colors.light} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.subtitle}>{formatCurrency(challenge.stakeCents, currency)} up for grabs</Text>
      </View>
      <Pressable
        onPress={onPressInfo}
        style={styles.infoPill}
        accessibilityRole="button"
        accessibilityLabel={`${label} challenge info`}
        hitSlop={4}
      >
        <Text style={styles.infoPillText}>Challenge info</Text>
        <Ionicons name="information-circle-outline" size={16} color={colors.primaryDark} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 2,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: touchTarget.min - 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  infoPillText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primaryDark,
  },
});
