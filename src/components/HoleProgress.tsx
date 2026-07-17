import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  currentHole: number;
  holeCount: number;
  /** "dark" is for use over a dark green background (e.g. the active-round hero) — light text/track, bright fill. */
  variant?: "light" | "dark";
};

export function HoleProgress({ currentHole, holeCount, variant = "light" }: Props) {
  const progress = Math.min(currentHole / holeCount, 1);
  const isDark = variant === "dark";

  return (
    <View accessibilityLabel={`Hole ${currentHole} of ${holeCount}`}>
      <Text style={[styles.label, isDark && styles.labelDark]}>
        Hole {currentHole} of {holeCount}
      </Text>
      <View style={[styles.track, isDark && styles.trackDark]}>
        <View style={[styles.fill, isDark && styles.fillDark, { width: `${progress * 100}%` }]} />
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
  labelDark: {
    color: colors.white,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
    minWidth: 120,
  },
  trackDark: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  fillDark: {
    backgroundColor: colors.success,
  },
});
