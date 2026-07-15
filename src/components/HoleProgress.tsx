import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  currentHole: number;
  holeCount: number;
};

export function HoleProgress({ currentHole, holeCount }: Props) {
  const progress = Math.min(currentHole / holeCount, 1);

  return (
    <View accessibilityLabel={`Hole ${currentHole} of ${holeCount}`}>
      <Text style={styles.label}>
        Hole {currentHole} of {holeCount}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
    minWidth: 120,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
});
