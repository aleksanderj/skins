import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../constants/theme";
import { Card } from "./Card";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";

type Props = {
  title: string;
  /** Live status line, e.g. "Team Pine 2 Up through 7", used while `resultLabel` is null. */
  statusText: string;
  resultLabel: string | null;
  winnerName: string | null;
  stakeCents: number;
  currency: CurrencyCode;
};

export function NassauStatusCard({ title, statusText, resultLabel, winnerName, stakeCents, currency }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.stake}>{formatCurrency(stakeCents, currency)}</Text>
      </View>
      {resultLabel ? (
        <Text style={styles.result}>
          {winnerName ? `${winnerName} wins ${resultLabel}` : resultLabel}
        </Text>
      ) : (
        <Text style={styles.status}>{statusText}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  stake: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  status: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  result: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 4,
  },
});
