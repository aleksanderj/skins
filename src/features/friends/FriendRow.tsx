import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlayerAvatar } from "../../components/PlayerAvatar";
import { colors, fontSize, spacing, touchTarget } from "../../constants/theme";
import type { SampleFriend } from "./sampleFriends";

type Props = {
  friend: SampleFriend;
  index: number;
};

export function FriendRow({ friend, index }: Props) {
  return (
    <View style={styles.row}>
      <PlayerAvatar name={friend.name} index={index} size={44} />
      <View style={styles.nameBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {friend.name}
        </Text>
        <Text style={styles.handicap}>Handicap {friend.handicap}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget.min,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  handicap: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
