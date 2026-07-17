import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/theme";
import { formatCurrency } from "../../utils/currency";
import { getChallengeTypeIcon, getChallengeTypeLabel } from "./challengeMeta";
import type { Challenge, CurrencyCode } from "../../types";

type Props = {
  challenges: Challenge[];
  currency: CurrencyCode;
};

/** Compact stake pill(s) for the current hole's HoleInfoCard header — one per challenge riding on this hole. */
export function ChallengeHoleBadges({ challenges, currency }: Props) {
  return (
    <>
      {challenges.map((challenge) => (
        <View key={challenge.id} style={styles.badge}>
          <View style={styles.badgeHeader}>
            <Ionicons name={getChallengeTypeIcon(challenge.type)} size={12} color={colors.primaryDark} />
            <Text style={styles.badgeLabel} numberOfLines={1}>
              {getChallengeTypeLabel(challenge.type).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.badgeAmount}>{formatCurrency(challenge.stakeCents, currency)}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    maxWidth: 180,
  },
  badgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.3,
  },
  badgeAmount: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: 2,
  },
});
