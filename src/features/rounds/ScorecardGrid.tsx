import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SegmentedControl } from "../../components/SegmentedControl";
import { ScoreMark } from "../../components/ScoreMark";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "../../utils/handicap";
import { calculateRelativeMatchPlayHandicaps, getMatchPlayStrokesForHole } from "../../utils/matchPlay";
import { getScoreToParCategory } from "../../utils/scoreToPar";
import { colors, fontSize, spacing } from "../../constants/theme";
import type { Round } from "../../types";

const ROW_HEIGHT = 48;

type Props = {
  round: Round;
  /** When provided, hole headers and score cells become tappable to jump to that hole. Omit for read-only display. */
  onEditHole?: (holeNumber: number) => void;
};

export function ScorecardGrid({ round, onEditHole }: Props) {
  const [scoreView, setScoreView] = useState<"gross" | "net">("gross");
  const isMatchPlay = round.format === "match_play";
  const relativeHandicaps =
    isMatchPlay && round.matchPlayConfig
      ? calculateRelativeMatchPlayHandicaps(round.players, round.holeCount, round.matchPlayConfig.handicapAllowancePercent)
      : {};
  const holes = round.holes.slice(0, round.holeCount);

  return (
    <View>
      <Text style={styles.title}>Scorecard</Text>
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          value={scoreView}
          onChange={setScoreView}
          options={[
            { value: "gross", label: "Gross Scores" },
            { value: "net", label: "Net Scores" },
          ]}
        />
      </View>
      {onEditHole ? <Text style={styles.hint}>Tap any score to edit that hole.</Text> : null}

      <View style={styles.tableRow}>
        <View style={styles.nameColumn}>
          <View style={[styles.cell, styles.nameCell, { height: ROW_HEIGHT }]}>
            <Text style={styles.holeLabelText}>Hole</Text>
          </View>
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
              {holes.map((hole) =>
                onEditHole ? (
                  <Pressable
                    key={hole.number}
                    onPress={() => onEditHole(hole.number)}
                    style={[styles.cell, styles.holeHeaderCell, { height: ROW_HEIGHT }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit hole ${hole.number}`}
                  >
                    <Text style={styles.holeHeaderText}>{hole.number}</Text>
                  </Pressable>
                ) : (
                  <View key={hole.number} style={[styles.cell, styles.holeHeaderCell, { height: ROW_HEIGHT }]}>
                    <Text style={styles.holeHeaderText}>{hole.number}</Text>
                  </View>
                )
              )}
            </View>

            {round.players.map((player) => {
              const playingHandicap = calculatePlayingHandicap(player.handicap, round.holeCount);
              return (
                <View key={player.id} style={styles.scoreRow}>
                  {holes.map((hole) => {
                    const record = round.scores.find((s) => s.playerId === player.id && s.holeNumber === hole.number);
                    const gross = record?.grossScore ?? null;
                    const strokes = isMatchPlay
                      ? getMatchPlayStrokesForHole(relativeHandicaps[player.id] ?? 0, hole.strokeIndex, round.holeCount)
                      : getHandicapStrokesForHole(playingHandicap, hole.strokeIndex, round.holeCount);
                    const displayValue = scoreView === "net" ? calculateNetScore(gross, strokes) : gross;
                    const category = gross !== null ? getScoreToParCategory(gross, hole.par) : null;
                    const label = `${player.name}, hole ${hole.number}, score ${displayValue ?? "not entered"}`;
                    const content =
                      displayValue === null ? (
                        <Text style={styles.emptyText}>–</Text>
                      ) : category ? (
                        <ScoreMark score={displayValue} category={category} />
                      ) : (
                        <Text style={styles.scoreCellText}>{displayValue}</Text>
                      );

                    return onEditHole ? (
                      <Pressable
                        key={hole.number}
                        onPress={() => onEditHole(hole.number)}
                        style={[styles.cell, styles.scoreCell, { height: ROW_HEIGHT }]}
                        accessibilityRole="button"
                        accessibilityLabel={label}
                      >
                        {content}
                      </Pressable>
                    ) : (
                      <View key={hole.number} style={[styles.cell, styles.scoreCell, { height: ROW_HEIGHT }]} accessibilityLabel={label}>
                        {content}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  segmentWrapper: {
    alignSelf: "flex-end",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
  scoreCell: {
    width: 40,
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
  holeLabelText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
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
  emptyText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    width: 40,
    textAlign: "center",
  },
});
