import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { PlayerAvatar } from "../../components/PlayerAvatar";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import { formatCurrency } from "../../utils/currency";
import { getChallengeTypeIcon, getChallengeTypeLabel } from "./challengeMeta";
import type { Challenge, Round } from "../../types";

type Props = {
  round: Round;
  challenge: Challenge;
  onSetWinner: (playerId: string | null) => void;
  onRemove: () => void;
};

/** Winner is picked by tapping a player chip directly — tapping the current winner again clears it. No separate picker screen needed since a round has at most a handful of players. */
export function ChallengeCard({ round, challenge, onSetWinner, onRemove }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={getChallengeTypeIcon(challenge.type)} size={18} color={colors.primaryDark} />
          <Text style={styles.title}>{getChallengeTypeLabel(challenge.type)}</Text>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${getChallengeTypeLabel(challenge.type)} challenge`}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.meta}>
        Hole {challenge.holeNumber} · {formatCurrency(challenge.stakeCents, round.currency)} stake
      </Text>

      <View style={styles.playersRow}>
        {round.players.map((player, index) => {
          const isWinner = challenge.winnerPlayerId === player.id;
          return (
            <Pressable
              key={player.id}
              onPress={() => onSetWinner(isWinner ? null : player.id)}
              style={[styles.chip, isWinner && styles.chipSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isWinner }}
              accessibilityLabel={
                isWinner
                  ? `${player.name} won — tap to clear`
                  : `Mark ${player.name} as the winner of this challenge`
              }
            >
              <PlayerAvatar name={player.name} index={index} size={28} />
              <Text style={[styles.chipText, isWinner && styles.chipTextSelected]} numberOfLines={1}>
                {player.name}
              </Text>
              {isWinner ? <Ionicons name="checkmark-circle" size={16} color={colors.positive} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTarget.min - 8,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    borderColor: colors.positive,
    backgroundColor: "#E4F4EB",
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    maxWidth: 90,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
});
