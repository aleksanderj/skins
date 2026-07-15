import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { formatSignedCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";

type Props = {
  cents: number;
  currency?: CurrencyCode;
};

/** Pairs color with a directional icon so the meaning never depends on color alone. */
export function BalanceBadge({ cents, currency = "USD" }: Props) {
  const isPositive = cents > 0;
  const isNegative = cents < 0;

  return (
    <View
      style={[
        styles.badge,
        isPositive && styles.positiveBg,
        isNegative && styles.negativeBg,
        !isPositive && !isNegative && styles.neutralBg,
      ]}
    >
      {isPositive ? (
        <Ionicons name="arrow-up" size={14} color={colors.positive} />
      ) : isNegative ? (
        <Ionicons name="arrow-down" size={14} color={colors.negative} />
      ) : null}
      <Text
        style={[
          styles.text,
          isPositive && styles.positiveText,
          isNegative && styles.negativeText,
          !isPositive && !isNegative && styles.neutralText,
        ]}
      >
        {formatSignedCurrency(cents, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  positiveBg: { backgroundColor: "#E4F4EB" },
  negativeBg: { backgroundColor: "#FBEAE6" },
  neutralBg: { backgroundColor: colors.light },
  text: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  positiveText: { color: colors.positive },
  negativeText: { color: colors.negative },
  neutralText: { color: colors.textSecondary },
});
