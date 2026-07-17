import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  size?: number;
  iconSize?: number;
};

/** Floating white circular icon button — the leaderboard shortcut in the round header and the hole navigator's back/forward controls. */
export function IconCircleButton({ icon, onPress, accessibilityLabel, disabled, size = 44, iconSize = 22 }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Ionicons name={icon} size={iconSize} color={disabled ? colors.disabled : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
