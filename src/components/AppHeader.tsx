import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing, touchTarget } from "../constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Small decorative icon shown after the title, e.g. a flag on "Review Round". */
  titleIcon?: IconName;
  /** Small decorative icon shown before the subtitle, e.g. a pin before a course name. */
  subtitleIcon?: IconName;
};

export function AppHeader({ title, subtitle, onBack, right, titleIcon, subtitleIcon }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        ) : null}
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {titleIcon ? <Ionicons name={titleIcon} size={20} color={colors.accent} /> : null}
          </View>
          {subtitle ? (
            <View style={styles.subtitleRow}>
              {subtitleIcon ? <Ionicons name={subtitleIcon} size={13} color={colors.textSecondary} /> : null}
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  backButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
    marginLeft: -spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});
