import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecondaryButton } from "../../components/SecondaryButton";
import { AddChallengeModal } from "../challenges/AddChallengeModal";
import { getChallengeTypeIcon, getChallengeTypeLabel } from "../challenges/challengeMeta";
import { colors, fontSize, spacing } from "../../constants/theme";
import { formatCurrency } from "../../utils/currency";
import type { CreateRoundChallengeInput } from "./types";
import type { ChallengeType, CurrencyCode, Hole } from "../../types";

type Props = {
  challenges: CreateRoundChallengeInput[];
  onChange: (challenges: CreateRoundChallengeInput[]) => void;
  holes: Hole[];
  holeCount: 9 | 18;
  currency: CurrencyCode;
};

/** Optional side bets (closest to the pin / longest drive) set up before the round starts — resolved later from the in-round Leaderboard's Challenges tab. */
export function ChallengesSetupSection({ challenges, onChange, holes, holeCount, currency }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = (type: ChallengeType, holeNumber: number, stakeCents: number) => {
    onChange([...challenges, { type, holeNumber, stakeCents }]);
    setShowAddModal(false);
  };

  const handleRemove = (index: number) => {
    onChange(challenges.filter((_, i) => i !== index));
  };

  return (
    <View>
      {challenges.length === 0 ? (
        <Text style={styles.hint}>Optional — add a closest-to-the-pin or longest-drive side bet.</Text>
      ) : (
        challenges.map((challenge, index) => (
          <View key={index} style={styles.row}>
            <Ionicons name={getChallengeTypeIcon(challenge.type)} size={18} color={colors.primaryDark} />
            <View style={styles.info}>
              <Text style={styles.title}>{getChallengeTypeLabel(challenge.type)}</Text>
              <Text style={styles.meta}>
                Hole {challenge.holeNumber} · {formatCurrency(challenge.stakeCents, currency)} stake
              </Text>
            </View>
            <Pressable
              onPress={() => handleRemove(index)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${getChallengeTypeLabel(challenge.type)} challenge`}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))
      )}

      <SecondaryButton label="+ Add Challenge" onPress={() => setShowAddModal(true)} style={styles.addButton} />

      <AddChallengeModal
        visible={showAddModal}
        holes={holes}
        holeCount={holeCount}
        currency={currency}
        defaultHoleNumber={1}
        onAdd={handleAdd}
        onCancel={() => setShowAddModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
