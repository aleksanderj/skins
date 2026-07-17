import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "../../components/PrimaryButton";
import { HoleProgress } from "../../components/HoleProgress";
import { PlayerAvatar } from "../../components/PlayerAvatar";
import { HoleFlagIllustration } from "../../components/HoleFlagIllustration";
import { colors, fontSize, radius, spacing } from "../../constants/theme";
import { formatCurrency } from "../../utils/currency";
import { getMatchPlayStatusHeadline, getRoundWinnerSummary } from "./selectors";
import { ActiveRoundHeroBackground } from "./ActiveRoundHeroBackground";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onResume: () => void;
};

export function ActiveRoundCard({ round, onResume }: Props) {
  const isMatchPlay = round.format === "match_play";
  const leader = getRoundWinnerSummary(round);
  const statusText = isMatchPlay ? getMatchPlayStatusHeadline(round) : (leader.name ?? "No skins yet");
  const stakeCents = isMatchPlay ? (round.matchPlayConfig?.stakeCents ?? 0) : (round.skinsConfig?.stakePerSkinCents ?? 0);
  const stakeCaption = isMatchPlay ? "per hole" : "per skin";

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <ActiveRoundHeroBackground />
        <View style={styles.heroFlag}>
          <HoleFlagIllustration size={64} />
        </View>

        <Text style={styles.eyebrow}>{isMatchPlay ? "MATCH PLAY" : "SKINS"} IN PROGRESS</Text>
        <Text style={styles.course} numberOfLines={1}>
          {round.courseName}
        </Text>

        <View style={styles.progressRow}>
          <HoleProgress currentHole={round.currentHole} holeCount={round.holeCount} variant="dark" />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{isMatchPlay ? "STATUS" : "LEADER"}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {statusText || "All Square"}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>FORMAT</Text>
            <View style={styles.formatValueRow}>
              <Text style={styles.statValue}>{isMatchPlay ? "Match Play" : "Skins"}</Text>
              {isMatchPlay ? (
                <Ionicons name="information-circle-outline" size={16} color={colors.light} />
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.playersLabel}>{round.players.length} PLAYERS</Text>

        <View style={styles.bodyRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.playersScroll}
            contentContainerStyle={styles.playersRow}
          >
            {round.players.map((player, index) => (
              <View key={player.id} style={styles.playerItem}>
                <PlayerAvatar name={player.name} index={index} size={48} />
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          {stakeCents > 0 ? (
            <View style={styles.stakeBox}>
              <View style={styles.stakeHeaderRow}>
                <Ionicons name="trophy" size={14} color={colors.accent} />
                <Text style={styles.stakeLabel}>ON THE LINE</Text>
              </View>
              <Text style={styles.stakeAmount}>{formatCurrency(stakeCents, round.currency)}</Text>
              <Text style={styles.stakeCaption}>{stakeCaption}</Text>
            </View>
          ) : null}
        </View>

        <PrimaryButton label="View Round" onPress={onResume} style={styles.button} icon="chevron-forward" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  hero: {
    backgroundColor: colors.primaryDark,
    padding: spacing.lg,
    overflow: "hidden",
  },
  heroFlag: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    opacity: 0.9,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.success,
    letterSpacing: 1,
  },
  course: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.white,
    marginTop: 4,
  },
  progressRow: {
    marginTop: spacing.lg,
    maxWidth: 220,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  stat: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.light,
    opacity: 0.75,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.white,
    marginTop: 2,
  },
  formatValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: spacing.xl,
  },
  body: {
    padding: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  playersLabel: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  playersScroll: {
    flex: 1,
  },
  playersRow: {
    gap: spacing.lg,
    paddingRight: spacing.sm,
  },
  playerItem: {
    alignItems: "center",
    width: 64,
  },
  playerName: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
  },
  stakeBox: {
    backgroundColor: colors.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.md,
    minWidth: 128,
  },
  stakeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stakeLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 0.3,
  },
  stakeAmount: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.primaryDark,
    marginTop: 2,
  },
  stakeCaption: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  button: {
    marginTop: spacing.lg,
  },
});
