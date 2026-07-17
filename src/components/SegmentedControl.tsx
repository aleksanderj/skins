import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "light" (default) is the iOS-style white-chip-on-gray-track look used for tab bars. "dark" is a solid primaryDark selected chip, e.g. the Scorecard's Gross/Net toggle. */
  variant?: "light" | "dark";
};

export function SegmentedControl<T extends string>({ options, value, onChange, variant = "light" }: Props<T>) {
  const isDark = variant === "dark";

  return (
    <View style={[styles.container, isDark && styles.containerDark]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && (isDark ? styles.segmentSelectedDark : styles.segmentSelected)]}
          >
            <Text
              style={[styles.label, selected && (isDark ? styles.labelSelectedDark : styles.labelSelected)]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.light,
    borderRadius: radius.md,
    padding: 4,
  },
  containerDark: {
    backgroundColor: colors.background,
  },
  segment: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    minHeight: touchTarget.min - 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentSelectedDark: {
    backgroundColor: colors.primaryDark,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
  labelSelectedDark: {
    color: colors.white,
    fontWeight: "700",
  },
});
