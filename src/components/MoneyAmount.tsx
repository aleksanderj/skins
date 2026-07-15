import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import { colors, fontSize } from "../constants/theme";
import { formatCurrency, formatSignedCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";

type Props = {
  cents: number;
  currency?: CurrencyCode;
  signed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  style?: TextStyle;
};

/**
 * Never communicates positive/negative with color alone — the sign
 * character and, where space allows, a word suffix carry the meaning too.
 */
export function MoneyAmount({ cents, currency = "USD", signed = true, size = "md", style }: Props) {
  const text = signed ? formatSignedCurrency(cents, currency) : formatCurrency(cents, currency);
  const tone = cents > 0 ? styles.positive : cents < 0 ? styles.negative : styles.neutral;

  return (
    <Text
      style={[styles.base, sizeStyles[size], tone, style]}
      accessibilityLabel={
        cents > 0
          ? `up ${formatCurrency(cents, currency)}`
          : cents < 0
            ? `down ${formatCurrency(Math.abs(cents), currency)}`
            : `even, ${formatCurrency(0, currency)}`
      }
    >
      {text}
    </Text>
  );
}

const sizeStyles = StyleSheet.create({
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.xl },
  xl: { fontSize: fontSize.xxxl },
});

const styles = StyleSheet.create({
  base: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  positive: { color: colors.positive },
  negative: { color: colors.negative },
  neutral: { color: colors.textSecondary },
});
