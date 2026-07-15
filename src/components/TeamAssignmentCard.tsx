import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing, touchTarget } from "../constants/theme";
import { PlayerAvatar } from "./PlayerAvatar";
import { Card } from "./Card";

export type TeamAssignmentPlayer = { id: string; name: string };

type Props = {
  teamName: string;
  onChangeName: (name: string) => void;
  players: TeamAssignmentPlayer[];
  avatarIndexOffset: number;
  moveLabel: string;
  onMovePlayer: (playerId: string) => void;
  onReorder: (playerId: string, direction: -1 | 1) => void;
};

export function TeamAssignmentCard({
  teamName,
  onChangeName,
  players,
  avatarIndexOffset,
  moveLabel,
  onMovePlayer,
  onReorder,
}: Props) {
  return (
    <Card style={styles.card}>
      <TextInput
        value={teamName}
        onChangeText={onChangeName}
        style={styles.nameInput}
        accessibilityLabel="Team name"
        placeholder="Team name"
        placeholderTextColor={colors.textSecondary}
      />

      {players.map((player, index) => (
        <View key={player.id} style={styles.row}>
          <PlayerAvatar name={player.name || "?"} index={avatarIndexOffset + index} size={32} />
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name || "Unnamed player"}
          </Text>

          <View style={styles.controls}>
            <Pressable
              onPress={() => onReorder(player.id, -1)}
              disabled={index === 0}
              accessibilityRole="button"
              accessibilityLabel={`Move ${player.name} up within ${teamName}`}
              style={[styles.iconButton, index === 0 && styles.iconButtonDisabled]}
            >
              <Ionicons name="chevron-up" size={16} color={index === 0 ? colors.border : colors.text} />
            </Pressable>
            <Pressable
              onPress={() => onReorder(player.id, 1)}
              disabled={index === players.length - 1}
              accessibilityRole="button"
              accessibilityLabel={`Move ${player.name} down within ${teamName}`}
              style={[styles.iconButton, index === players.length - 1 && styles.iconButtonDisabled]}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={index === players.length - 1 ? colors.border : colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() => onMovePlayer(player.id)}
              accessibilityRole="button"
              accessibilityLabel={`${moveLabel}: ${player.name}`}
              style={styles.iconButton}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
            </Pressable>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  nameInput: {
    fontSize: fontSize.md,
    fontWeight: "800",
    color: colors.text,
    minHeight: touchTarget.min - 8,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  playerName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
  },
  controls: {
    flexDirection: "row",
    gap: 2,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
});
