import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../constants/theme";
import { PlayerAvatar } from "./PlayerAvatar";
import { BalanceBadge } from "./BalanceBadge";
import type { CurrencyCode } from "../types";

type Props = {
  rank: number;
  name: string;
  index: number;
  skinsWon: number;
  balanceCents: number;
  currency: CurrencyCode;
};

export function LeaderboardRow({ rank, name, index, skinsWon, balanceCents, currency }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <PlayerAvatar name={name} index={index} size={36} />
      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.skins}>
          {skinsWon} skin{skinsWon === 1 ? "" : "s"}
        </Text>
      </View>
      <BalanceBadge cents={balanceCents} currency={currency} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
  },
  rank: {
    width: 24,
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  nameBlock: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  skins: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
