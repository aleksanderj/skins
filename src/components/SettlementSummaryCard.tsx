import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";
import { Card } from "./Card";

type Entry = {
  fromName: string;
  toName: string;
  amountCents: number;
};

type Props = {
  totalPotCents: number;
  entries: Entry[];
  currency: CurrencyCode;
};

/**
 * Read-only "who owes whom" summary for a completed round: a Total Pot
 * headline, one card listing every payment, and a disclaimer that the app
 * never moves money itself. Distinct from SettlementCard, which is the
 * per-payment, checkbox-driven row used on the live end-of-round screen.
 */
export function SettlementSummaryCard({ totalPotCents, entries, currency }: Props) {
  return (
    <View>
      <Text style={styles.totalPot}>Total Pot: {formatCurrency(totalPotCents, currency)}</Text>

      <Card style={styles.card} padded={false}>
        {entries.map((entry, index) => (
          <View
            key={`${entry.fromName}-${entry.toName}-${index}`}
            style={[styles.row, index < entries.length - 1 && styles.rowDivider]}
          >
            <Text style={styles.owesText}>
              <Text style={styles.name}>{entry.fromName}</Text> owes <Text style={styles.name}>{entry.toName}</Text>
            </Text>
            <Text style={styles.amount}>{formatCurrency(entry.amountCents, currency)}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Skins doesn't process payments. Settle up however you choose.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalPot: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  card: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  owesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  name: {
    fontWeight: "700",
    color: colors.text,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.positive,
  },
  disclaimer: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  disclaimerText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
