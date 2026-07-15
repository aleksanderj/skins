import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";
import { Card } from "./Card";

type Props = {
  fromName: string;
  toName: string;
  amountCents: number;
  currency: CurrencyCode;
  settled?: boolean;
  onToggleSettled?: () => void;
};

export function SettlementCard({ fromName, toName, amountCents, currency, settled, onToggleSettled }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.names}>
            {fromName} <Text style={styles.arrow}>pays</Text> {toName}
          </Text>
          <Text style={styles.amount}>{formatCurrency(amountCents, currency)}</Text>
        </View>

        {onToggleSettled ? (
          <Pressable
            onPress={onToggleSettled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!settled }}
            accessibilityLabel={`Mark ${fromName} pays ${toName} as settled`}
            style={[styles.checkbox, settled && styles.checkboxChecked]}
            hitSlop={8}
          >
            {settled ? <Ionicons name="checkmark" size={20} color={colors.white} /> : null}
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBlock: {
    flexShrink: 1,
  },
  names: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  arrow: {
    color: colors.textSecondary,
    fontWeight: "500",
  },
  amount: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: 4,
  },
  checkbox: {
    width: touchTarget.min - 8,
    height: touchTarget.min - 8,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
