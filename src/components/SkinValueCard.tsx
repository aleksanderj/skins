import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import type { CurrencyCode } from "../types";
import { HoleInfoCard } from "./HoleInfoCard";

type Props = {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  skinsAtStake: number;
  stakePerSkinCents: number;
  currency: CurrencyCode;
  isCarryover: boolean;
  /** Challenge stake pill(s) for this hole, composed by the caller (see ChallengeHoleBadges) — keeps this component free of a src/features import. */
  challengeBadges?: React.ReactNode;
};

export function SkinValueCard({
  holeNumber,
  par,
  strokeIndex,
  skinsAtStake,
  stakePerSkinCents,
  currency,
  isCarryover,
  challengeBadges,
}: Props) {
  const totalCents = skinsAtStake * stakePerSkinCents;

  return (
    <HoleInfoCard
      holeNumber={holeNumber}
      par={par}
      strokeIndex={strokeIndex}
      headerRight={
        <>
          {isCarryover ? (
            <View style={styles.carryoverPill}>
              <Ionicons name="repeat" size={14} color={colors.warning} />
              <Text style={styles.carryoverText}>Carryover</Text>
            </View>
          ) : null}
          {challengeBadges}
        </>
      }
      footer={
        <View style={styles.stakeRow}>
          <View>
            <Text style={styles.worthLine}>WORTH</Text>
            <Text style={styles.skinsLine}>
              {skinsAtStake} SKIN{skinsAtStake > 1 ? "S" : ""}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stakeBlockRight}>
            <Text style={styles.stakeAmount}>{formatCurrency(totalCents, currency)}</Text>
            <Text style={styles.stakeLabel}>AT STAKE</Text>
          </View>
          <View style={styles.coinCircle}>
            <Ionicons name="cash-outline" size={20} color={colors.light} />
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
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
  stakeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  worthLine: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  skinsLine: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: spacing.md,
  },
  stakeBlockRight: {
    flex: 1,
  },
  stakeAmount: {
    color: colors.light,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  stakeLabel: {
    color: colors.light,
    fontSize: fontSize.xs,
    fontWeight: "700",
    opacity: 0.85,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  coinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
