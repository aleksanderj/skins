import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import { PlayerAvatar } from "../../components/PlayerAvatar";

export type PlayerDraft = {
  id: string;
  name: string;
  handicapText: string;
};

type Props = {
  player: PlayerDraft;
  index: number;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChangeName: (name: string) => void;
  onChangeHandicap: (text: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  error?: string;
};

export function PlayerFormRow({
  player,
  index,
  canRemove,
  canMoveUp,
  canMoveDown,
  onChangeName,
  onChangeHandicap,
  onRemove,
  onMoveUp,
  onMoveDown,
  error,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PlayerAvatar name={player.name || `Player ${index + 1}`} index={index} size={36} />

        <TextInput
          value={player.name}
          onChangeText={onChangeName}
          placeholder={`Player ${index + 1} name`}
          placeholderTextColor={colors.textSecondary}
          style={styles.nameInput}
          accessibilityLabel={`Player ${index + 1} name`}
        />

        <TextInput
          value={player.handicapText}
          onChangeText={onChangeHandicap}
          placeholder="HCP"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          style={styles.handicapInput}
          accessibilityLabel={`Player ${index + 1} handicap`}
          maxLength={2}
        />
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.reorderControls}>
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp}
            accessibilityRole="button"
            accessibilityLabel={`Move ${player.name || `player ${index + 1}`} up`}
            style={[styles.iconButton, !canMoveUp && styles.iconButtonDisabled]}
          >
            <Ionicons name="chevron-up" size={18} color={canMoveUp ? colors.text : colors.border} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown}
            accessibilityRole="button"
            accessibilityLabel={`Move ${player.name || `player ${index + 1}`} down`}
            style={[styles.iconButton, !canMoveDown && styles.iconButtonDisabled]}
          >
            <Ionicons name="chevron-down" size={18} color={canMoveDown ? colors.text : colors.border} />
          </Pressable>
        </View>

        {canRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${player.name || `player ${index + 1}`}`}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={16} color={colors.negative} />
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
    minHeight: touchTarget.min,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: "600",
  },
  handicapInput: {
    width: 56,
    minHeight: touchTarget.min,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    textAlign: "center",
    fontSize: fontSize.md,
    color: colors.text,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  reorderControls: {
    flexDirection: "row",
    gap: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: touchTarget.min - 12,
    paddingHorizontal: spacing.sm,
  },
  removeText: {
    color: colors.negative,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  error: {
    color: colors.negative,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
