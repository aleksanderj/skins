import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  name: string;
  side: "A" | "B";
};

export function TeamBadge({ name, side }: Props) {
  return (
    <View style={[styles.badge, side === "A" ? styles.sideA : styles.sideB]}>
      <Text style={[styles.text, side === "A" ? styles.textA : styles.textB]} numberOfLines={1}>
        {name}
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
  },
  sideA: {
    backgroundColor: colors.light,
  },
  sideB: {
    backgroundColor: "#FCF3E1",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  textA: {
    color: colors.primaryDark,
  },
  textB: {
    color: colors.warning,
  },
});
