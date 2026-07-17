import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SecondaryButton } from "../../components/SecondaryButton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { StakeSelector } from "../rounds/StakeSelector";
import { STAKE_PRESETS_CENTS } from "../../constants/golf";
import { colors, fontSize, radius, spacing } from "../../constants/theme";
import { getChallengeTypeLabel } from "./challengeMeta";
import type { ChallengeType, CurrencyCode, Hole } from "../../types";

type Props = {
  visible: boolean;
  holes: Hole[];
  holeCount: 9 | 18;
  currency: CurrencyCode;
  defaultHoleNumber: number;
  onAdd: (type: ChallengeType, holeNumber: number, stakeCents: number) => void;
  onCancel: () => void;
};

export function AddChallengeModal({
  visible,
  holes,
  holeCount,
  currency,
  defaultHoleNumber,
  onAdd,
  onCancel,
}: Props) {
  const [type, setType] = useState<ChallengeType>("closest_to_pin");
  const [holeNumber, setHoleNumber] = useState(defaultHoleNumber);
  const [stakeCents, setStakeCents] = useState<number>(STAKE_PRESETS_CENTS[0]);

  // Re-default the hole each time the modal opens.
  useEffect(() => {
    if (visible) setHoleNumber(defaultHoleNumber);
  }, [visible, defaultHoleNumber]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheetWrapper} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.title}>Add Challenge</Text>

            <Text style={styles.label}>Type</Text>
            <SegmentedControl
              value={type}
              onChange={setType}
              options={[
                { value: "closest_to_pin", label: getChallengeTypeLabel("closest_to_pin") },
                { value: "longest_drive", label: getChallengeTypeLabel("longest_drive") },
              ]}
            />

            <Text style={styles.label}>Hole</Text>
            <View style={styles.holeGrid}>
              {holes.slice(0, holeCount).map((hole) => {
                const selected = hole.number === holeNumber;
                return (
                  <Pressable
                    key={hole.number}
                    onPress={() => setHoleNumber(hole.number)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Hole ${hole.number}`}
                    style={[styles.holePill, selected && styles.holePillSelected]}
                  >
                    <Text style={[styles.holePillText, selected && styles.holePillTextSelected]}>{hole.number}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Stake</Text>
            <StakeSelector valueCents={stakeCents} onChange={setStakeCents} currency={currency} />

            <View style={styles.actions}>
              <SecondaryButton label="Cancel" onPress={onCancel} style={styles.actionButton} />
              <PrimaryButton
                label="Add"
                onPress={() => onAdd(type, holeNumber, stakeCents)}
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(21,33,27,0.5)",
  },
  sheetWrapper: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  holeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  holePill: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  holePillSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.light,
  },
  holePillText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  holePillTextSelected: {
    color: colors.primaryDark,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
});
