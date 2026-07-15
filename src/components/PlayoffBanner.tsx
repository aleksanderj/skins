import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  playoffHoleNumber: number;
};

export function PlayoffBanner({ playoffHoleNumber }: Props) {
  return (
    <View style={styles.banner} accessibilityLabel={`Sudden-death playoff, hole ${playoffHoleNumber}`}>
      <Ionicons name="flash" size={18} color={colors.white} />
      <Text style={styles.text}>Playoff Hole {playoffHoleNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
});
