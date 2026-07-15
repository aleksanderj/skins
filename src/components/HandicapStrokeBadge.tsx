import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  strokes: number;
};

/** Shown next to a player/side's score in net-scoring Match Play rows. Renders nothing at zero strokes. */
export function HandicapStrokeBadge({ strokes }: Props) {
  if (strokes <= 0) return null;

  return (
    <View style={styles.badge} accessibilityLabel={`Receives ${strokes} handicap stroke${strokes > 1 ? "s" : ""}`}>
      <Text style={styles.text}>
        {strokes} stroke{strokes > 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "#FCF3E1",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.warning,
  },
});
