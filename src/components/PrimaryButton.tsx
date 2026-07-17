import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  haptics?: boolean;
  /** Trailing icon, e.g. "chevron-forward" for a "go to" style button. */
  icon?: IconName;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  accessibilityHint,
  haptics = true,
  icon,
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
      ) : icon ? (
        <View style={styles.contentRowSpaced}>
          <Text style={[styles.label, styles.labelWithIcon, disabled && styles.labelDisabled]}>{label}</Text>
          <Ionicons name={icon} size={20} color={disabled ? colors.disabled : colors.white} />
        </View>
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
    color: colors.disabled,
  },
  contentRowSpaced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  labelWithIcon: {
    flex: 1,
    textAlign: "center",
  },
});
