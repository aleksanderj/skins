import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  haptics?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  accessibilityHint,
  haptics = true,
}: Props) {
  const handlePress = () => {
    if (haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : styles.enabled,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.min + 8,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  enabled: {
    backgroundColor: colors.primaryDark,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.border,
  },
  label: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
});
