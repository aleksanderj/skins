import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import type { Hole } from "../../types";

type Props = {
  holes: Hole[];
  onChange: (holes: Hole[]) => void;
  error?: string;
};

const PAR_OPTIONS: Array<3 | 4 | 5> = [3, 4, 5];

export function CourseSetupSection({ holes, onChange, error }: Props) {
  const [expanded, setExpanded] = useState(false);

  const updateHole = (number: number, updates: Partial<Hole>) => {
    onChange(holes.map((h) => (h.number === number ? { ...h, ...updates } : h)));
  };

  return (
    <View>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.toggleRow}
      >
        <Text style={styles.toggleLabel}>Course Setup</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.hint}>Par and stroke index are pre-filled. Edit them to match your course.</Text>

      {expanded ? (
        <View style={styles.list}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.holeCell]}>Hole</Text>
            <Text style={[styles.headerCell, styles.parCell]}>Par</Text>
            <Text style={[styles.headerCell, styles.siCell]}>Stroke Index</Text>
          </View>
          {holes.map((hole) => (
            <View key={hole.number} style={styles.row}>
              <Text style={[styles.holeCell, styles.holeNumber]}>{hole.number}</Text>
              <View style={[styles.parCell, styles.parOptions]}>
                {PAR_OPTIONS.map((par) => {
                  const selected = hole.par === par;
                  return (
                    <Pressable
                      key={par}
                      onPress={() => updateHole(hole.number, { par })}
                      accessibilityRole="button"
                      accessibilityLabel={`Hole ${hole.number} par ${par}`}
                      accessibilityState={{ selected }}
                      style={[styles.parPill, selected && styles.parPillSelected]}
                    >
                      <Text style={[styles.parPillText, selected && styles.parPillTextSelected]}>{par}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={String(hole.strokeIndex)}
                onChangeText={(text) => {
                  const parsed = parseInt(text, 10);
                  updateHole(hole.number, { strokeIndex: Number.isNaN(parsed) ? 0 : parsed });
                }}
                keyboardType="number-pad"
                style={[styles.siCell, styles.siInput]}
                accessibilityLabel={`Hole ${hole.number} stroke index`}
                maxLength={2}
              />
            </View>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: touchTarget.min,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  list: {
    marginTop: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holeCell: {
    width: 40,
  },
  holeNumber: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  parCell: {
    flex: 1,
  },
  parOptions: {
    flexDirection: "row",
    gap: 4,
  },
  parPill: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  parPillSelected: {
    backgroundColor: colors.light,
    borderColor: colors.primaryDark,
  },
  parPillText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "600",
  },
  parPillTextSelected: {
    color: colors.primaryDark,
  },
  siCell: {
    width: 70,
  },
  siInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    textAlign: "center",
    minHeight: 32,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  error: {
    color: colors.negative,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
