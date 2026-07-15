import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing, touchTarget } from "../../constants/theme";
import { SegmentedControl } from "../../components/SegmentedControl";
import { StakeSelector } from "./StakeSelector";
import type { CurrencyCode, HandicapAllowancePercent, MatchPlayMode, MatchPlayStructure, MatchPlayTieRule, ScoringMode } from "../../types";

const ALLOWANCE_OPTIONS: HandicapAllowancePercent[] = [100, 90, 85, 75];

type Props = {
  mode: MatchPlayMode;
  onModeChange: (mode: MatchPlayMode) => void;
  scoringMode: ScoringMode;
  onScoringModeChange: (mode: ScoringMode) => void;
  handicapAllowancePercent: HandicapAllowancePercent;
  onHandicapAllowanceChange: (percent: HandicapAllowancePercent) => void;
  structure: MatchPlayStructure;
  onStructureChange: (structure: MatchPlayStructure) => void;
  holeCount: 9 | 18;
  stakeCents: number;
  onStakeChange: (cents: number) => void;
  tieRule: MatchPlayTieRule;
  onTieRuleChange: (rule: MatchPlayTieRule) => void;
  currency: CurrencyCode;
};

export function MatchPlaySettingsSection({
  mode,
  onModeChange,
  scoringMode,
  onScoringModeChange,
  handicapAllowancePercent,
  onHandicapAllowanceChange,
  structure,
  onStructureChange,
  holeCount,
  stakeCents,
  onStakeChange,
  tieRule,
  onTieRuleChange,
  currency,
}: Props) {
  const nassauAvailable = holeCount === 18;

  return (
    <View>
      <Text style={styles.label}>Match type</Text>
      <SegmentedControl
        value={mode}
        onChange={onModeChange}
        options={[
          { value: "individual", label: "Individual" },
          { value: "team", label: "Team" },
        ]}
      />
      <Text style={styles.hint}>
        {mode === "individual" ? "Head-to-head, one player against another." : "Best score on each team counts."}
      </Text>

      <Text style={styles.label}>Scoring</Text>
      <SegmentedControl
        value={scoringMode}
        onChange={onScoringModeChange}
        options={[
          { value: "gross", label: "Gross" },
          { value: "net", label: "Net" },
        ]}
      />

      <Text style={styles.label}>Handicap allowance</Text>
      <View style={styles.pillRow}>
        {ALLOWANCE_OPTIONS.map((percent) => {
          const selected = percent === handicapAllowancePercent;
          return (
            <Pressable
              key={percent}
              onPress={() => onHandicapAllowanceChange(percent)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{percent}%</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Handicap allowance adjusts the strokes players receive in the match.</Text>

      <Text style={styles.label}>Structure</Text>
      <SegmentedControl
        value={structure}
        onChange={(value) => {
          if (value === "nassau" && !nassauAvailable) return;
          onStructureChange(value);
        }}
        options={[
          { value: "single_match", label: "Single Match" },
          { value: "nassau", label: nassauAvailable ? "Nassau" : "Nassau (18 holes only)" },
        ]}
      />

      <Text style={styles.label}>Stake per match</Text>
      <StakeSelector valueCents={stakeCents} onChange={onStakeChange} currency={currency} />

      <Text style={styles.label}>Tie rule</Text>
      <SegmentedControl
        value={tieRule}
        onChange={onTieRuleChange}
        options={[
          { value: "halve", label: "Halve" },
          { value: "playoff", label: "Sudden-Death Playoff" },
        ]}
      />
      {structure === "nassau" ? (
        <Text style={styles.hint}>Nassau matches always halve on a tie — sudden-death applies to Single Match only.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    minWidth: 56,
    minHeight: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.light,
  },
  pillText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  pillTextSelected: {
    color: colors.primaryDark,
  },
});
