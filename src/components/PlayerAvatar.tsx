import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius } from "../constants/theme";
import { DEFAULT_PLAYER_COLORS } from "../constants/golf";

type Props = {
  name: string;
  index?: number;
  size?: number;
};

export function PlayerAvatar({ name, index = 0, size = 40 }: Props) {
  const initials = getInitials(name);
  const background = DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius.pill, backgroundColor: background },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.white,
    fontWeight: "700",
  },
});
