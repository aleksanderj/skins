import React from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { Card } from "../../../src/components/Card";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SecondaryButton } from "../../../src/components/SecondaryButton";
import { SettlementSummaryCard } from "../../../src/components/SettlementSummaryCard";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { PlayerAvatar } from "../../../src/components/PlayerAvatar";
import { MatchResultCard } from "../../../src/components/MatchResultCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { EmptyState } from "../../../src/components/EmptyState";
import {
  getMatchPlaySideName,
  getPlayerBalances,
  getPlayerName,
  getRoundMatchPlaySides,
  getSettlements,
} from "../../../src/features/rounds/selectors";
import { buildShareText } from "../../../src/features/settlements/shareText";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing } from "../../../src/constants/theme";

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
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <Text style={styles.headline}>Round Complete</Text>
        <Text style={styles.subheadline}>{round.courseName}</Text>

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
          <Card style={styles.winnerCard}>
            <PlayerAvatar name={getPlayerName(round, winner.playerId)} index={0} size={56} />
            <Text style={styles.winnerName}>{getPlayerName(round, winner.playerId)}</Text>
            <Text style={styles.winnerSkins}>
              {winner.skinsWon ?? 0} skin{(winner.skinsWon ?? 0) === 1 ? "" : "s"} won
            </Text>
            <MoneyAmount cents={winner.balanceCents} currency={round.currency} size="xl" />
          </Card>
        ) : (
          <Card style={styles.winnerCard}>
            <Text style={styles.winnerName}>All square</Text>
            <Text style={styles.winnerSkins}>No net winner this round</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Who pays whom</Text>
        {settlements.length === 0 ? (
          <Card>
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
            }))}
          />
        )}

        <Text style={styles.sectionTitle}>Final balances</Text>
        <Card>
          {balances.map((b) => (
            <View key={b.playerId} style={styles.balanceRow}>
              <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
              <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
            </View>
          ))}
        </Card>

        {!isMatchPlay ? (
          <>
            <Text style={styles.sectionTitle}>Skin summary</Text>
            <Card>
              {balances.map((b) => (
                <View key={b.playerId} style={styles.balanceRow}>
                  <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
                  <Text style={styles.skinCount}>
                    {b.skinsWon ?? 0} skin{(b.skinsWon ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
              ))}
            </Card>
          </>
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
  headline: {
    fontSize: fontSize.xxl,
    fontWeight: "800",
    color: colors.primaryDark,
    textAlign: "center",
  },
  subheadline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.lg,
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
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  winnerName: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
  },
  winnerSkins: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  noSettlements: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  skinCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
