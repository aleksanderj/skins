import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radius, touchTarget } from "../constants/theme";

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  /** Score a first tap lands on, before the player has entered anything — typically the hole's par. */
  defaultValue: number;
  min?: number;
  max?: number;
  label: string;
};

export function ScoreStepper({ value, onChange, defaultValue, min = 1, max = 15, label }: Props) {
  const decrement = () => {
    const next = value === null ? defaultValue : Math.max(min, value - 1);
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };
  const increment = () => {
    const next = value === null ? defaultValue : Math.min(max, value + 1);
    Haptics.selectionAsync().catch(() => {});
    onChange(next);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={decrement}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label} score`}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        hitSlop={4}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>

      <View style={styles.valueBox} accessibilityLabel={`${label} score: ${value ?? "not entered"}`}>
        <Text style={styles.valueText}>{value ?? "–"}</Text>
      </View>

      <Pressable
        onPress={increment}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label} score`}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        hitSlop={4}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: radius.md,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  valueBox: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
});
