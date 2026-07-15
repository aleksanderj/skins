import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { Card } from "../../../src/components/Card";
import { SegmentedControl } from "../../../src/components/SegmentedControl";
import { LeaderboardRow } from "../../../src/components/LeaderboardRow";
import { MatchStatusCard } from "../../../src/components/MatchStatusCard";
import { NassauStatusCard } from "../../../src/components/NassauStatusCard";
import { MatchProgressStrip, type MatchProgressEntry } from "../../../src/components/MatchProgressStrip";
import { MoneyAmount } from "../../../src/components/MoneyAmount";
import { EmptyState } from "../../../src/components/EmptyState";
import {
  getPlayerBalances,
  getPlayerName,
  getRoundMatchPlaySides,
} from "../../../src/features/rounds/selectors";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../../../src/utils/handicap";
import { calculateRelativeMatchPlayHandicaps, getMatchPlayStrokesForHole } from "../../../src/utils/matchPlay";
import { formatCurrency } from "../../../src/utils/currency";
import { colors, fontSize, spacing } from "../../../src/constants/theme";
import type { MatchPlayHoleResult, Round } from "../../../src/types";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { roundId } = useLocalSearchParams<{ roundId: string }>();
  const activeRound = useAppStore((s) => s.activeRound);
  const round = activeRound && activeRound.id === roundId ? activeRound : null;

  if (!round) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="Leaderboard" onBack={() => router.back()} />
        <EmptyState icon="alert-circle-outline" title="No active round" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title={round.format === "match_play" ? "Match" : "Leaderboard"} subtitle={round.courseName} onBack={() => router.back()} />
      {round.format === "match_play" ? <MatchPlayLeaderboard round={round} /> : <SkinsLeaderboard round={round} />}
    </View>
  );
}

function SkinsLeaderboard({ round }: { round: Round }) {
  const [view, setView] = useState<"balances" | "skins">("balances");
  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);
  const skinResults = round.skinsResult?.skinResults ?? [];

  return (
    <>
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "balances", label: "Balances" },
            { value: "skins", label: "Skins" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {view === "balances" ? (
          <Card>
            {balances.map((b, index) => (
              <LeaderboardRow
                key={b.playerId}
                rank={index + 1}
                name={getPlayerName(round, b.playerId)}
                index={index}
                skinsWon={b.skinsWon ?? 0}
                balanceCents={b.balanceCents}
                currency={round.currency}
              />
            ))}
          </Card>
        ) : skinResults.length === 0 ? (
          <EmptyState icon="flag-outline" title="No holes submitted yet" message="Skin outcomes will appear here hole by hole." />
        ) : (
          <Card padded={false}>
            {skinResults.map((result) => (
              <View key={result.holeNumber} style={styles.skinRow}>
                <View style={styles.skinHoleBadge}>
                  <Text style={styles.skinHoleNumber}>{result.holeNumber}</Text>
                </View>
                <View style={styles.skinInfo}>
                  {result.winnerPlayerId ? (
                    <Text style={styles.skinWinner}>{getPlayerName(round, result.winnerPlayerId)}</Text>
                  ) : (
                    <Text style={styles.skinTied}>Tied</Text>
                  )}
                  <Text style={styles.skinMeta}>
                    {result.skinsWon > 0
                      ? `${result.skinsWon} skin${result.skinsWon > 1 ? "s" : ""} · ${formatCurrency(result.monetaryValueCents, round.currency)}`
                      : result.carriedIntoNextHoleCents > 0
                        ? "Carried forward"
                        : "No skin awarded"}
                  </Text>
                </View>
                {result.carriedIntoNextHoleCents > 0 ? <Ionicons name="repeat" size={18} color={colors.warning} /> : null}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  );
}

function MatchPlayLeaderboard({ round }: { round: Round }) {
  const [view, setView] = useState<"match" | "scorecard" | "balances">("match");
  const sides = getRoundMatchPlaySides(round);
  const config = round.matchPlayConfig;

  if (!sides || !config) {
    return (
      <View style={styles.scroll}>
        <EmptyState icon="alert-circle-outline" title="Match setup incomplete" />
      </View>
    );
  }

  const balances = [...getPlayerBalances(round)].sort((a, b) => b.balanceCents - a.balanceCents);

  return (
    <>
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: "match", label: "Match" },
            { value: "scorecard", label: "Scorecard" },
            { value: "balances", label: "Balances" },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {view === "match" ? (
          <MatchView round={round} />
        ) : view === "scorecard" ? (
          <ScorecardView round={round} />
        ) : (
          <View>
            <Text style={styles.confirmedLabel}>Current confirmed balance</Text>
            <Card padded={false}>
              {balances.map((b, index) => (
                <View key={b.playerId} style={styles.balanceRow}>
                  <Text style={styles.balanceName}>{getPlayerName(round, b.playerId)}</Text>
                  <MoneyAmount cents={b.balanceCents} currency={round.currency} size="md" />
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function MatchView({ round }: { round: Round }) {
  const sides = getRoundMatchPlaySides(round)!;
  const result = round.matchPlayResult;

  if (result?.structure === "nassau") {
    const stakeCents = round.matchPlayConfig?.stakeCents ?? 0;
    const titles: Record<string, string> = { front: "Front Nine", back: "Back Nine", overall: "Overall" };
    return (
      <View>
        {(result.nassauMatches ?? []).map((match) => {
          const last = match.holeResults[match.holeResults.length - 1];
          const statusText = last
            ? `${statusHeadline(last.statusAfterHole, sides.sideA.name, sides.sideB.name)} through ${last.holeNumber - match.startHole + 1}`
            : "All Square";
          const winnerName = match.winnerSideId ? (match.winnerSideId === sides.sideA.id ? sides.sideA.name : sides.sideB.name) : null;
          return (
            <NassauStatusCard
              key={match.segment}
              title={titles[match.segment]}
              statusText={statusText}
              resultLabel={match.resultLabel}
              winnerName={winnerName}
              stakeCents={stakeCents}
              currency={round.currency}
            />
          );
        })}
      </View>
    );
  }

  const single = result?.singleMatch;
  const holeResults = single?.holeResults ?? [];
  const last = holeResults[holeResults.length - 1];
  const holesRemaining = last ? last.holesRemaining : round.holeCount;

  const entries: MatchProgressEntry[] = holeResults.map((h) => ({
    holeNumber: h.holeNumber,
    winner: h.winnerSideId === sides.sideA.id ? "A" : h.winnerSideId === sides.sideB.id ? "B" : null,
  }));

  return (
    <View>
      <MatchStatusCard
        headline={last ? statusHeadline(last.statusAfterHole, sides.sideA.name, sides.sideB.name) : "All Square"}
        subline={
          single?.winnerSideId
            ? `${single.resultLabel}`
            : single?.isHalved
              ? "Match Halved"
              : last
                ? `Through ${last.holeNumber}${last.isDormie ? ` · ${holesRemaining} to play` : ""}`
                : "Not started"
        }
        isDormie={last?.isDormie}
        isComplete={!!single?.winnerSideId || !!single?.isHalved}
      />

      {entries.length > 0 ? (
        <Card style={styles.stripCard}>
          <Text style={styles.stripLabel}>Hole by hole</Text>
          <MatchProgressStrip entries={entries} sideAInitial={initial(sides.sideA.name)} sideBInitial={initial(sides.sideB.name)} />
        </Card>
      ) : null}
    </View>
  );
}

function ScorecardView({ round }: { round: Round }) {
  const config = round.matchPlayConfig!;
  const relativeHandicaps = calculateRelativeMatchPlayHandicaps(round.players, round.holeCount, config.handicapAllowancePercent);

  return (
    <Card padded={false}>
      {round.players.map((player) => {
        const playingHandicap = calculatePlayingHandicap(player.handicap, round.holeCount);
        return (
          <View key={player.id} style={styles.scoreCardRow}>
            <Text style={styles.scoreCardName}>{player.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.scoreCardHoles}>
                {round.holes.slice(0, round.holeCount).map((hole) => {
                  const record = round.scores.find((s) => s.playerId === player.id && s.holeNumber === hole.number);
                  const gross = record?.grossScore ?? null;
                  const strokes = getMatchPlayStrokesForHole(relativeHandicaps[player.id] ?? 0, hole.strokeIndex, round.holeCount);
                  const net = calculateNetScore(gross, strokes);
                  return (
                    <View key={hole.number} style={styles.scoreCardCell}>
                      <Text style={styles.scoreCardCellText}>{gross ?? "–"}</Text>
                      {config.scoringMode === "net" && net !== null ? (
                        <Text style={styles.scoreCardNetText}>{net}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );
      })}
    </Card>
  );
}

function statusHeadline(status: number, sideAName: string, sideBName: string): string {
  if (status === 0) return "All Square";
  const leader = status > 0 ? sideAName : sideBName;
  return `${leader} ${Math.abs(status)} Up`;
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  scroll: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  skinRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skinHoleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  skinHoleNumber: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  skinInfo: {
    flex: 1,
  },
  skinWinner: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  skinTied: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.warning,
  },
  skinMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stripCard: {
    marginTop: spacing.md,
  },
  stripLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  confirmedLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  balanceName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
  },
  scoreCardRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreCardName: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scoreCardHoles: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  scoreCardCell: {
    width: 32,
    alignItems: "center",
  },
  scoreCardCellText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.text,
  },
  scoreCardNetText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
