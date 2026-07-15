import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../constants/theme";
import { PlayerAvatar } from "./PlayerAvatar";
import { ScoreStepper } from "./ScoreStepper";
import { BalanceBadge } from "./BalanceBadge";
import type { CurrencyCode } from "../types";

type Props = {
  name: string;
  index: number;
  grossScore: number | null;
  strokesReceived: number;
  netScore: number | null;
  showNet: boolean;
  balanceCents: number;
  currency: CurrencyCode;
  defaultScore: number;
  onChangeScore: (value: number) => void;
};

export function PlayerScoreRow({
  name,
  index,
  grossScore,
  strokesReceived,
  netScore,
  showNet,
  balanceCents,
  currency,
  defaultScore,
  onChangeScore,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.identity}>
        <PlayerAvatar name={name} index={index} size={36} />
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.meta}>
            {showNet && strokesReceived > 0 ? (
              <Text style={styles.strokes}>
                {strokesReceived} stroke{strokesReceived > 1 ? "s" : ""}
                {netScore !== null ? ` · net ${netScore}` : ""}
              </Text>
            ) : null}
            <BalanceBadge cents={balanceCents} currency={currency} />
          </View>
        </View>
      </View>

      <ScoreStepper value={grossScore} onChange={onChangeScore} defaultValue={defaultScore} label={name} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  nameBlock: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    gap: 2,
  },
  strokes: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: "600",
  },
});
