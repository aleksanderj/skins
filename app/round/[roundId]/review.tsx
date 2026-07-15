import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { PrimaryButton } from "../../../src/components/PrimaryButton";
import { SegmentedControl } from "../../../src/components/SegmentedControl";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { EmptyState } from "../../../src/components/EmptyState";
import {
  getPlayerBalances,
  getUnresolvedCarryoverCents,
  isRoundReadyToComplete,
} from "../../../src/features/rounds/selectors";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../../../src/utils/handicap";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing } from "../../../src/constants/theme";

const ROW_HEIGHT = 44;

export default function RoundReviewScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const completeRound = useAppStore((s) => s.completeRound);

  const round = activeRound && activeRound.id === roundId ? activeRound : null;
  const [scoreView, setScoreView] = useState<"gross" | "net">("gross");

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Review" onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title="No active round" />
      </View>
    );
  }

  const ready = isRoundReadyToComplete(round);
  const unresolvedCarryoverCents = getUnresolvedCarryoverCents(round);
  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);

  const editHole = (holeNumber: number) => {
    router.push(`/round/${round.id}?hole=${holeNumber}`);
  };

  const handleComplete = () => {
    completeRound();
    router.replace(`/round/${round.id}/settlement`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Review Round" subtitle={round.courseName} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {!ready ? (
          <Card style={StyleSheet.flatten([styles.card, styles.warningCard])}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Some holes are missing scores. Complete every hole before finishing the round.
            </Text>
          </Card>
        ) : null}

        {unresolvedCarryoverCents > 0 ? (
          <Card style={StyleSheet.flatten([styles.card, styles.warningCard])}>
            <Ionicons name="repeat" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              {formatCurrency(unresolvedCarryoverCents, round.currency)} in carried skins went unresolved —
              the final hole tied.
            </Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={styles.sectionTitle}>Scorecard</Text>
            <SegmentedControl
              value={scoreView}
              onChange={setScoreView}
              options={[
                { value: "gross", label: "Gross" },
                { value: "net", label: "Net" },
              ]}
            />
          </View>
          <Text style={styles.hint}>Tap any score to edit that hole.</Text>

          <View style={styles.tableRow}>
            <View style={styles.nameColumn}>
              <View style={[styles.cell, { height: ROW_HEIGHT }]} />
              {round.players.map((p) => (
                <View key={p.id} style={[styles.cell, styles.nameCell, { height: ROW_HEIGHT }]}>
                  <Text style={styles.nameCellText} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.holeHeaderRow}>
                  {round.holes.slice(0, round.holeCount).map((hole) => (
                    <Pressable
                      key={hole.number}
                      onPress={() => editHole(hole.number)}
                      style={[styles.cell, styles.holeHeaderCell, { height: ROW_HEIGHT }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit hole ${hole.number}`}
                    >
                      <Text style={styles.holeHeaderText}>{hole.number}</Text>
                    </Pressable>
                  ))}
                </View>

                {round.players.map((player) => {
                  const playingHandicap = calculatePlayingHandicap(player.handicap, round.holeCount);
                  return (
                    <View key={player.id} style={styles.scoreRow}>
                      {round.holes.slice(0, round.holeCount).map((hole) => {
                        const record = round.scores.find(
                          (s) => s.playerId === player.id && s.holeNumber === hole.number
                        );
                        const gross = record?.grossScore ?? null;
                        const strokes = getHandicapStrokesForHole(playingHandicap, hole.strokeIndex, round.holeCount);
                        const displayValue = scoreView === "net" ? calculateNetScore(gross, strokes) : gross;

                        return (
                          <Pressable
                            key={hole.number}
                            onPress={() => editHole(hole.number)}
                            style={[styles.cell, { height: ROW_HEIGHT }]}
                            accessibilityRole="button"
                            accessibilityLabel={`${player.name}, hole ${hole.number}, score ${displayValue ?? "not entered"}`}
                          >
                            <Text style={styles.scoreCellText}>{displayValue ?? "–"}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Skins &amp; balances</Text>
          {balances.map((b) => {
            const player = round.players.find((p) => p.id === b.playerId);
            return (
              <View key={b.playerId} style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceName}>{player?.name}</Text>
                  <Text style={styles.balanceSkins}>
                    {b.skinsWon} skin{b.skinsWon === 1 ? "" : "s"} won
                  </Text>
                </View>
                <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
              </View>
            );
          })}
        </Card>

        <PrimaryButton
          label="Complete Round"
          onPress={handleComplete}
          disabled={!ready}
          style={styles.completeButton}
          accessibilityHint={ready ? undefined : "Finish entering every hole's scores first"}
        />
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
  card: {
    marginBottom: spacing.md,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FCF3E1",
    borderColor: colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tableRow: {
    flexDirection: "row",
  },
  nameColumn: {
    width: 90,
  },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameCell: {
    alignItems: "flex-start",
    paddingRight: spacing.sm,
  },
  nameCellText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  holeHeaderRow: {
    flexDirection: "row",
  },
  holeHeaderCell: {
    width: 40,
    backgroundColor: colors.light,
  },
  holeHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  scoreRow: {
    flexDirection: "row",
  },
  scoreCellText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    width: 40,
    textAlign: "center",
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
    fontWeight: "700",
    color: colors.text,
  },
  balanceSkins: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  completeButton: {
    marginTop: spacing.sm,
  },
});
