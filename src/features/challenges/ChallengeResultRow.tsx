import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/theme";
import { formatSignedCurrency } from "../../utils/currency";
import { getChallengeTypeIcon, getChallengeTypeLabel } from "./challengeMeta";
import type { Challenge, CurrencyCode, Hole } from "../../types";

type Props = {
  challenge: Challenge;
  winnerName: string | null;
  hole: Hole | undefined;
  currency: CurrencyCode;
};

/** Flat results panel for a challenge on the Review screen — distinct from ChallengeInfoRow, which surfaces a still-live challenge during scoring rather than its outcome. */
export function ChallengeResultRow({ challenge, winnerName, hole, currency }: Props) {
  const label = getChallengeTypeLabel(challenge.type);

  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Ionicons name={getChallengeTypeIcon(challenge.type)} size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.subtitle}>
          Hole {challenge.holeNumber}
          {hole ? ` · Par ${hole.par}` : ""}
        </Text>
      </View>
      {winnerName ? (
        <View style={styles.result}>
          <Text style={styles.resultLabel}>Winner</Text>
          <View style={styles.resultBottomRow}>
            <Text style={styles.winnerName}>{winnerName}</Text>
            <Text style={styles.amount}>{formatSignedCurrency(challenge.stakeCents, currency)}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.pending}>Not decided</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
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
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  result: {
    alignItems: "flex-end",
  },
  resultLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.accent,
  },
  resultBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginTop: 2,
  },
  winnerName: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.positive,
  },
  pending: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
