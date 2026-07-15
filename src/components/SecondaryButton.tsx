import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  tone?: "default" | "danger";
  accessibilityHint?: string;
};

export function SecondaryButton({ label, onPress, disabled, style, tone = "default", accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        tone === "danger" ? styles.danger : styles.default,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, tone === "danger" && styles.dangerLabel, disabled && styles.disabledLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.min,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  default: {
    borderColor: colors.primaryDark,
    backgroundColor: "transparent",
  },
  danger: {
    borderColor: colors.negative,
    backgroundColor: "transparent",
  },
  pressed: {
    backgroundColor: colors.light,
  },
  disabled: {
    borderColor: colors.border,
  },
  label: {
    color: colors.primaryDark,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  dangerLabel: {
    color: colors.negative,
  },
  disabledLabel: {
    color: colors.textSecondary,
  },
});
