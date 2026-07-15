import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../constants/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

export function GameFormatCard({ icon, title, description, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}: ${description}`}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
        <Ionicons name={icon} size={22} color={selected ? colors.white : colors.primaryDark} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.light,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconCircleSelected: {
    backgroundColor: colors.primaryDark,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  titleSelected: {
    color: colors.primaryDark,
  },
  description: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
