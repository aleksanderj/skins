import React, { useState } from "react";
import { ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppStore } from "../../../src/store/useAppStore";
import { Card } from "../../../src/components/Card";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SecondaryButton } from "../../../src/components/SecondaryButton";
import { SettlementCard } from "../../../src/components/SettlementCard";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { PlayerAvatar } from "../../../src/components/PlayerAvatar";
import { EmptyState } from "../../../src/components/EmptyState";
import { getPlayerBalances, getPlayerName, getSettlements } from "../../../src/features/rounds/selectors";
import { buildShareText } from "../../../src/features/settlements/shareText";
import { colors, fontSize, spacing } from "../../../src/constants/theme";

export default function SettlementScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const roundHistory = useAppStore((s) => s.roundHistory);

  const round = activeRound?.id === roundId ? activeRound : roundHistory.find((r) => r.id === roundId) ?? null;
  const [settledPayments, setSettledPayments] = useState<Record<number, boolean>>({});

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

  const togglePayment = (index: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSettledPayments((prev) => ({ ...prev, [index]: !prev[index] }));
  };

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headline}>Round Complete</Text>
        <Text style={styles.subheadline}>{round.courseName}</Text>

        {winner ? (
          <Card style={styles.winnerCard}>
            <PlayerAvatar name={getPlayerName(round, winner.playerId)} index={0} size={56} />
            <Text style={styles.winnerName}>{getPlayerName(round, winner.playerId)}</Text>
            <Text style={styles.winnerSkins}>
              {winner.skinsWon} skin{winner.skinsWon === 1 ? "" : "s"} won
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
          settlements.map((s, index) => (
            <SettlementCard
              key={`${s.fromPlayerId}-${s.toPlayerId}-${index}`}
              fromName={getPlayerName(round, s.fromPlayerId)}
              toName={getPlayerName(round, s.toPlayerId)}
              amountCents={s.amountCents}
              currency={round.currency}
              settled={!!settledPayments[index]}
              onToggleSettled={() => togglePayment(index)}
            />
          ))
        )}
        <Text style={styles.disclaimer}>Payments happen outside the app.</Text>

        <Text style={styles.sectionTitle}>Final balances</Text>
        <Card>
          {balances.map((b) => (
            <View key={b.playerId} style={styles.balanceRow}>
              <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
              <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>Skin summary</Text>
        <Card>
          {balances.map((b) => (
            <View key={b.playerId} style={styles.balanceRow}>
              <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
              <Text style={styles.skinCount}>
                {b.skinsWon} skin{b.skinsWon === 1 ? "" : "s"}
              </Text>
            </View>
          ))}
        </Card>

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
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.xs,
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
