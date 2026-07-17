import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";
import { HoleFlagIllustration } from "./HoleFlagIllustration";

type Props = {
  holeNumber: number;
  par: number;
  strokeIndex: number;
  /** Pills stacked top-right of the header — e.g. a carryover indicator, challenge stake badges. Wraps if it doesn't fit on one line. */
  headerRight?: React.ReactNode;
  /** Bottom section below the illustration — e.g. Skins' "Worth N skins / at stake" row. Omit for formats with no per-hole stake to show. */
  footer?: React.ReactNode;
};

/** The dark green hole-summary card shown atop the scoring screen for every format — hole number, par/stroke index, and whatever's riding on this hole. */
export function HoleInfoCard({ holeNumber, par, strokeIndex, headerRight, footer }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.holeLabelWrap}>
          <Text style={styles.holeLabel}>HOLE {holeNumber}</Text>
          <Text style={styles.detail}>
            Par {par} · Stroke Index {strokeIndex}
          </Text>
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>

      <View style={styles.illustrationRow}>
        <HoleFlagIllustration />
      </View>

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  holeLabelWrap: {
    flexShrink: 1,
  },
  holeLabel: {
    color: colors.light,
    fontSize: fontSize.sm,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detail: {
    color: colors.light,
    fontSize: fontSize.sm,
    marginTop: 4,
    opacity: 0.85,
  },
  headerRight: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.xs,
    flexShrink: 1,
    marginLeft: spacing.sm,
  },
  illustrationRow: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
});
