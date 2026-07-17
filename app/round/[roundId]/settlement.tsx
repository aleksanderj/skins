import React from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { IconCircleButton } from "../../../src/components/IconCircleButton";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SecondaryButton } from "../../../src/components/SecondaryButton";
import { SettlementSummaryCard } from "../../../src/components/SettlementSummaryCard";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { BalanceBadge } from "../../../src/components/BalanceBadge";
import { PlayerAvatar } from "../../../src/components/PlayerAvatar";
import { MatchResultCard } from "../../../src/components/MatchResultCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { EmptyState } from "../../../src/components/EmptyState";
import {
  getMatchPlaySideName,
  getPlayerBalances,
  getPlayerIndex,
  getPlayerName,
  getRoundMatchPlaySides,
  getSettlements,
} from "../../../src/features/rounds/selectors";
import { buildShareText } from "../../../src/features/settlements/shareText";
import { formatCurrency } from "../../../src/utils/currency";
import { DEFAULT_PLAYER_COLORS } from "../../../src/constants/golf";
import { colors, fontSize, radius, spacing } from "../../../src/constants/theme";

export default function SettlementScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const roundHistory = useAppStore((s) => s.roundHistory);

  const round = activeRound?.id === roundId ? activeRound : roundHistory.find((r) => r.id === roundId) ?? null;

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Round not found"
          actionLabel="Go home"
          onAction={() => router.replace("/")}
        />
      </View>
    );
  }

  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);
  const settlements = getSettlements(round);
  const winner = balances[0] && balances[0].balanceCents > 0 ? balances[0] : null;
  const isMatchPlay = round.format === "match_play";
  const sides = isMatchPlay ? getRoundMatchPlaySides(round) : null;
  const totalPotCents = balances.reduce((sum, b) => sum + Math.max(b.balanceCents, 0), 0);

  const handleShare = async () => {
    const text = buildShareText(round, balances, settlements);
    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled or share failed silently — nothing to recover from here.
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="Round Complete"
        subtitle={round.courseName}
        subtitleIcon="location-outline"
        onBack={() => router.back()}
        right={
          <IconCircleButton
            icon="settings-outline"
            onPress={() => router.push("/settings")}
            accessibilityLabel="Settings"
          />
        }
      />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        {isMatchPlay && sides && round.matchPlayResult ? (
          <View style={styles.matchSummaryWrapper}>
            {round.matchPlayResult.structure === "nassau" ? (
              (round.matchPlayResult.nassauMatches ?? []).map((match) => (
                <NassauStatusCard
                  key={match.segment}
                  title={match.segment === "front" ? "Front Nine" : match.segment === "back" ? "Back Nine" : "Overall"}
                  statusText=""
                  resultLabel={match.resultLabel}
                  winnerName={match.winnerSideId ? getMatchPlaySideName(round, match.winnerSideId) : null}
                  stakeCents={round.matchPlayConfig?.stakeCents ?? 0}
                  currency={round.currency}
                />
              ))
            ) : round.matchPlayResult.singleMatch ? (
              <MatchResultCard
                winnerName={
                  round.matchPlayResult.singleMatch.winnerSideId
                    ? getMatchPlaySideName(round, round.matchPlayResult.singleMatch.winnerSideId)
                    : null
                }
                loserName={
                  round.matchPlayResult.singleMatch.winnerSideId
                    ? getMatchPlaySideName(
                        round,
                        round.matchPlayResult.singleMatch.winnerSideId === sides.sideA.id ? sides.sideB.id : sides.sideA.id
                      )
                    : null
                }
                resultLabel={round.matchPlayResult.singleMatch.resultLabel}
                isHalved={round.matchPlayResult.singleMatch.isHalved}
              />
            ) : null}
            <Text style={styles.stakeLine}>
              Stake: {formatCurrency(round.matchPlayConfig?.stakeCents ?? 0, round.currency)}
              {round.matchPlayConfig?.structure === "nassau" ? " per match" : ""}
            </Text>
          </View>
        ) : winner ? (
          <View style={styles.winnerCard}>
            <View style={styles.winnerContent}>
              <View style={styles.winnerTopRow}>
                <PlayerAvatar name={getPlayerName(round, winner.playerId)} index={getPlayerIndex(round, winner.playerId)} size={56} />
                <View style={styles.winnerPill}>
                  <Ionicons name="trophy" size={12} color={colors.primaryDark} />
                  <Text style={styles.winnerPillText}>WINNER</Text>
                </View>
              </View>
              <Text style={styles.winnerName}>{getPlayerName(round, winner.playerId)}</Text>
              <Text style={styles.winnerSkins}>
                {winner.skinsWon ?? 0} skin{(winner.skinsWon ?? 0) === 1 ? "" : "s"} won
              </Text>
              <MoneyAmount cents={winner.balanceCents} currency={round.currency} size="xl" />
            </View>
            <Ionicons name="trophy" size={72} color="rgba(244, 185, 66, 0.28)" style={styles.winnerTrophyDecoration} />
          </View>
        ) : (
          <View style={[styles.winnerCard, styles.winnerCardNeutral]}>
            <Text style={styles.winnerName}>All Square</Text>
            <Text style={styles.winnerSkins}>No net winner this round</Text>
          </View>
        )}

        {settlements.length === 0 ? (
          <Card style={styles.sectionCard} padded={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="people" size={18} color={colors.primaryDark} />
              </View>
              <Text style={styles.sectionTitle}>Who pays whom</Text>
            </View>
            <Text style={styles.noSettlements}>No payments needed — everyone's square.</Text>
          </Card>
        ) : (
          <SettlementSummaryCard
            totalPotCents={totalPotCents}
            currency={round.currency}
            entries={settlements.map((s) => ({
              fromName: getPlayerName(round, s.fromPlayerId),
              toName: getPlayerName(round, s.toPlayerId),
              amountCents: s.amountCents,
              fromIndex: getPlayerIndex(round, s.fromPlayerId),
            }))}
          />
        )}

        <Card style={styles.sectionCard} padded={false}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderIcon}>
              <Ionicons name="wallet-outline" size={18} color={colors.primaryDark} />
            </View>
            <Text style={styles.sectionTitle}>Final balances</Text>
          </View>
          {balances.map((b) => (
            <View key={b.playerId} style={styles.balanceRow}>
              <View style={styles.balanceLeft}>
                <PlayerAvatar name={getPlayerName(round, b.playerId)} index={getPlayerIndex(round, b.playerId)} size={32} singleInitial />
                <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
              </View>
              <BalanceBadge cents={b.balanceCents} currency={round.currency} />
            </View>
          ))}
        </Card>

        {!isMatchPlay ? (
          <Card style={styles.sectionCard} padded={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="flag-outline" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Skin summary</Text>
                <Text style={styles.sectionSubtitle}>Based on {round.holeCount} holes</Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {balances.map((b) => {
                const playerIndex = getPlayerIndex(round, b.playerId);
                return (
                  <View key={b.playerId} style={styles.chip}>
                    <Text style={[styles.chipName, { color: DEFAULT_PLAYER_COLORS[playerIndex % DEFAULT_PLAYER_COLORS.length] }]}>
                      {getPlayerName(round, b.playerId)}
                    </Text>
                    <Text style={styles.chipCount}>
                      {b.skinsWon ?? 0} skin{(b.skinsWon ?? 0) === 1 ? "" : "s"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}

        <SecondaryButton label="Share Results" onPress={handleShare} style={styles.actionButton} />
        <PrimaryButton label="Return Home" onPress={() => router.replace("/")} style={styles.actionButton} />
      </ScrollView>
    </View>
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
  matchSummaryWrapper: {
    marginBottom: spacing.lg,
  },
  stakeLine: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  winnerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  winnerCardNeutral: {
    justifyContent: "center",
    alignItems: "center",
  },
  winnerContent: {
    flexShrink: 1,
  },
  winnerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  winnerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  winnerPillText: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  winnerName: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.white,
  },
  winnerSkins: {
    fontSize: fontSize.sm,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  winnerTrophyDecoration: {
    transform: [{ rotate: "-12deg" }],
    marginLeft: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noSettlements: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  balanceName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  chip: {
    flexGrow: 1,
    flexBasis: 70,
    alignItems: "center",
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chipName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  chipCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
