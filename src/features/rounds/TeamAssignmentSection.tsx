import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, spacing } from "../../constants/theme";
import { TeamAssignmentCard } from "../../components/TeamAssignmentCard";
import type { PlayerDraft } from "./PlayerFormRow";

type Props = {
  players: PlayerDraft[];
  teamAIds: string[];
  teamBIds: string[];
  teamAName: string;
  teamBName: string;
  onChangeTeamAName: (name: string) => void;
  onChangeTeamBName: (name: string) => void;
  onMovePlayer: (playerId: string) => void;
  onReorder: (playerId: string, teamSide: "A" | "B", direction: -1 | 1) => void;
  error?: string;
};

export function TeamAssignmentSection({
  players,
  teamAIds,
  teamBIds,
  teamAName,
  teamBName,
  onChangeTeamAName,
  onChangeTeamBName,
  onMovePlayer,
  onReorder,
  error,
}: Props) {
  const byId = (id: string) => players.find((p) => p.id === id);
  const teamAPlayers = teamAIds.map(byId).filter((p): p is PlayerDraft => !!p).map((p) => ({ id: p.id, name: p.name }));
  const teamBPlayers = teamBIds.map(byId).filter((p): p is PlayerDraft => !!p).map((p) => ({ id: p.id, name: p.name }));

  return (
    <View>
      <Text style={styles.sectionLabel}>Teams</Text>
      <TeamAssignmentCard
        teamName={teamAName}
        onChangeName={onChangeTeamAName}
        players={teamAPlayers}
        avatarIndexOffset={0}
        moveLabel={`Move to ${teamBName || "Team B"}`}
        onMovePlayer={onMovePlayer}
        onReorder={(playerId, direction) => onReorder(playerId, "A", direction)}
      />
      <TeamAssignmentCard
        teamName={teamBName}
        onChangeName={onChangeTeamBName}
        players={teamBPlayers}
        avatarIndexOffset={2}
        moveLabel={`Move to ${teamAName || "Team A"}`}
        onMovePlayer={onMovePlayer}
        onReorder={(playerId, direction) => onReorder(playerId, "B", direction)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  error: {
    color: colors.negative,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
});
