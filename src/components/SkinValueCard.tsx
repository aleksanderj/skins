import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";
import { Card } from "./Card";

type Props = {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  skinsAtStake: number;
  stakePerSkinCents: number;
  currency: CurrencyCode;
  isCarryover: boolean;
};

export function SkinValueCard({
  holeNumber,
  par,
  strokeIndex,
  skinsAtStake,
  stakePerSkinCents,
  currency,
  isCarryover,
}: Props) {
  const totalCents = skinsAtStake * stakePerSkinCents;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.holeLabel}>HOLE {holeNumber}</Text>
        {isCarryover ? (
          <View style={styles.carryoverPill}>
            <Ionicons name="repeat" size={14} color={colors.warning} />
            <Text style={styles.carryoverText}>Carryover</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.detail}>
        Par {par} · Stroke Index {strokeIndex}
      </Text>

      <View style={styles.stakeRow}>
        <Text style={styles.skinsText}>
          Worth {skinsAtStake} skin{skinsAtStake > 1 ? "s" : ""}
        </Text>
        <Text style={styles.stakeText}>{formatCurrency(totalCents, currency)} at stake</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryDark,
    borderWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  holeLabel: {
    color: colors.light,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1,
  },
  carryoverPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(197,138,24,0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  carryoverText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  detail: {
    color: colors.light,
    fontSize: fontSize.sm,
    marginTop: 4,
    opacity: 0.85,
  },
  stakeRow: {
    marginTop: spacing.md,
  },
  skinsText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  stakeText: {
    color: colors.light,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    marginTop: 2,
  },
});
