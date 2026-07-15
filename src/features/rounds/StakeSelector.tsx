import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import { STAKE_PRESETS_CENTS } from "../../constants/golf";
import { dollarsToCents, formatCurrency } from "../../utils/currency";
import type { CurrencyCode } from "../../types";

type Props = {
  valueCents: number;
  onChange: (cents: number) => void;
  currency: CurrencyCode;
};

export function StakeSelector({ valueCents, onChange, currency }: Props) {
  const isPreset = (STAKE_PRESETS_CENTS as readonly number[]).includes(valueCents);
  const [customMode, setCustomMode] = useState(!isPreset);
  const [customText, setCustomText] = useState(isPreset ? "" : (valueCents / 100).toString());

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    const parsed = parseFloat(text.replace(",", "."));
    if (!Number.isNaN(parsed) && parsed > 0) {
      onChange(dollarsToCents(parsed));
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {STAKE_PRESETS_CENTS.map((preset) => {
          const selected = !customMode && preset === valueCents;
          return (
            <Pressable
              key={preset}
              onPress={() => {
                setCustomMode(false);
                onChange(preset);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${formatCurrency(preset, currency)} per skin`}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {formatCurrency(preset, currency)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setCustomMode(true)}
          accessibilityRole="button"
          accessibilityState={{ selected: customMode }}
          style={[styles.pill, customMode && styles.pillSelected]}
        >
          <Text style={[styles.pillText, customMode && styles.pillTextSelected]}>Custom</Text>
        </Pressable>
      </View>

      {customMode ? (
        <View style={styles.customInputRow}>
          <Text style={styles.currencyPrefix}>{currency}</Text>
          <TextInput
            value={customText}
            onChangeText={handleCustomChange}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            style={styles.customInput}
            accessibilityLabel="Custom stake per skin"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
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
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  customInput: {
    flex: 1,
    minHeight: touchTarget.min,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
