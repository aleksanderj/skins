import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../../src/store/useAppStore";
import { AppHeader } from "../../src/components/AppHeader";
import { Card } from "../../src/components/Card";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { ConfirmationModal } from "../../src/components/ConfirmationModal";
import { StakeSelector } from "../../src/features/rounds/StakeSelector";
import { MatchPlaySettingsSection } from "../../src/features/rounds/MatchPlaySettingsSection";
import { CURRENCIES } from "../../src/constants/golf";
import { colors, fontSize, radius, spacing, touchTarget } from "../../src/constants/theme";
import type { CurrencyCode } from "../../src/types";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAppData = useAppStore((s) => s.resetAppData);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.groupTitle}>Skins Defaults</Text>
        <Card style={styles.card}>
          <Text style={styles.label}>Default scoring</Text>
          <SegmentedControl
            value={settings.skinsDefaults.scoringMode}
            onChange={(mode) => updateSettings({ skinsDefaults: { ...settings.skinsDefaults, scoringMode: mode } })}
            options={[
              { value: "gross", label: "Gross" },
              { value: "net", label: "Net" },
            ]}
          />

          <Text style={styles.label}>Default stake per skin</Text>
          <StakeSelector
            valueCents={settings.skinsDefaults.stakePerSkinCents}
            currency={settings.currency}
            onChange={(cents) => updateSettings({ skinsDefaults: { ...settings.skinsDefaults, stakePerSkinCents: cents } })}
          />

          <View style={styles.switchRow}>
            <View style={styles.flexShrink}>
              <Text style={styles.label}>Carryovers</Text>
              <Text style={styles.hint}>Tied holes roll their skin into the next hole by default.</Text>
            </View>
            <Switch
              value={settings.skinsDefaults.carryoversEnabled}
              onValueChange={(value) =>
                updateSettings({ skinsDefaults: { ...settings.skinsDefaults, carryoversEnabled: value } })
              }
              trackColor={{ false: colors.border, true: colors.accent }}
              accessibilityLabel="Default carryovers enabled"
            />
          </View>
        </Card>

        <Text style={styles.groupTitle}>Match Play Defaults</Text>
        <Card style={styles.card}>
          <MatchPlaySettingsSection
            mode={settings.matchPlayDefaults.mode}
            onModeChange={(mode) => updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, mode } })}
            scoringMode={settings.matchPlayDefaults.scoringMode}
            onScoringModeChange={(scoringMode) =>
              updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, scoringMode } })
            }
            handicapAllowancePercent={settings.matchPlayDefaults.handicapAllowancePercent}
            onHandicapAllowanceChange={(handicapAllowancePercent) =>
              updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, handicapAllowancePercent } })
            }
            structure={settings.matchPlayDefaults.structure}
            onStructureChange={(structure) =>
              updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, structure } })
            }
            holeCount={18}
            stakeCents={settings.matchPlayDefaults.stakeCents}
            onStakeChange={(stakeCents) => updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, stakeCents } })}
            tieRule={settings.matchPlayDefaults.tieRule}
            onTieRuleChange={(tieRule) => updateSettings({ matchPlayDefaults: { ...settings.matchPlayDefaults, tieRule } })}
            currency={settings.currency}
          />
        </Card>

        <Text style={styles.groupTitle}>General</Text>
        <Card style={styles.card}>
          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyList}>
            {CURRENCIES.map((c) => (
              <CurrencyOption
                key={c.code}
                code={c.code}
                label={c.label}
                selected={settings.currency === c.code}
                onPress={() => updateSettings({ currency: c.code })}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>About</Text>
          <Text style={styles.hint}>
            Skins is the fastest way for a group of golfers to run a Skins or Match Play game — set stakes, enter
            scores, and see live balances without doing the math by hand.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.disclaimer}>
            The app tracks friendly bets and calculates settlements. Payments are handled outside the app.
          </Text>
        </Card>

        <SecondaryButton
          label="Reset local app data"
          onPress={() => setShowResetConfirm(true)}
          tone="danger"
          style={styles.resetButton}
        />
      </ScrollView>

      <ConfirmationModal
        visible={showResetConfirm}
        title="Reset all app data?"
        message="This permanently deletes your active round, round history, and settings from this device. This can't be undone."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          resetAppData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </View>
  );
}

function CurrencyOption({
  code,
  label,
  selected,
  onPress,
}: {
  code: CurrencyCode;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.currencyRow, selected && styles.currencyRowSelected]}
    >
      <Text style={[styles.currencyText, selected && styles.currencyTextSelected]}>{label}</Text>
      {selected ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  groupTitle: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  flexShrink: {
    flexShrink: 1,
    marginRight: spacing.md,
  },
  currencyList: {
    gap: spacing.xs,
  },
  currencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  currencyRowSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.light,
  },
  currencyText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  currencyTextSelected: {
    color: colors.primaryDark,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryDark,
  },
  disclaimer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
  },
  resetButton: {
    marginTop: spacing.md,
  },
});
