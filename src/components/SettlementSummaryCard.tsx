import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";
import { Card } from "./Card";
import { PlayerAvatar } from "./PlayerAvatar";

type Entry = {
  fromName: string;
  toName: string;
  amountCents: number;
  /** Stable per-player color index (see getPlayerIndex) for the payer's avatar. Omit to skip the avatar. */
  fromIndex?: number;
};

type Props = {
  totalPotCents: number;
  entries: Entry[];
  currency: CurrencyCode;
};

/**
 * Read-only "who owes whom" summary for a completed round: an icon+title
 * header with the total pot, one payment per row, and a disclaimer that the
 * app never moves money itself. Distinct from SettlementCard, which is the
 * per-payment, checkbox-driven row used on the live end-of-round screen.
 */
export function SettlementSummaryCard({ totalPotCents, entries, currency }: Props) {
  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={18} color={colors.primaryDark} />
        </View>
        <View>
          <Text style={styles.title}>Who pays whom</Text>
          <Text style={styles.subtitle}>Total pot: {formatCurrency(totalPotCents, currency)}</Text>
        </View>
      </View>

      {entries.map((entry, index) => (
        <View key={`${entry.fromName}-${entry.toName}-${index}`} style={styles.row}>
          {entry.fromIndex !== undefined ? (
            <PlayerAvatar name={entry.fromName} index={entry.fromIndex} size={32} singleInitial />
          ) : null}
          <Text style={styles.owesText}>
            <Text style={styles.name}>{entry.fromName}</Text> owes <Text style={styles.name}>{entry.toName}</Text>
          </Text>
          <Text style={styles.amount}>{formatCurrency(entry.amountCents, currency)}</Text>
        </View>
      ))}

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.disclaimerText}>Skins doesn't process payments. Settle up however you choose.</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  owesText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.secondaryBackground,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
