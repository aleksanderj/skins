import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { MoneyAmount } from "../../components/MoneyAmount";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { useAppStore } from "../../store/useAppStore";
import { colors, fontSize, radius, spacing, touchTarget } from "../../constants/theme";
import { getMatchPlayResultSummary, getNassauSummary, getRoundWinnerSummary } from "../rounds/selectors";
import type { Round } from "../../types";

type Props = {
  round: Round;
  onPress: () => void;
};

const SKINS_ICON = "layers-outline";
const MATCH_PLAY_ICON = "swap-horizontal-outline";

export function RoundSummaryCard({ round, onPress }: Props) {
  const deleteRound = useAppStore((s) => s.deleteRound);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const date = round.completedAt ?? round.createdAt;
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isMatchPlay = round.format === "match_play";
  const scoringMode = isMatchPlay
    ? round.matchPlayConfig?.scoringMode === "net"
      ? "Net"
      : "Gross"
    : round.skinsConfig?.scoringMode === "net"
      ? "Net"
      : "Gross";

  return (
    <>
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Open results for round at ${round.courseName} on ${formattedDate}`}
          style={({ pressed }) => [pressed && styles.pressed, styles.touchable]}
        >
          <Card>
            <View style={styles.topRow}>
              <View style={[styles.badge, isMatchPlay && styles.badgeMatchPlay]}>
                <Ionicons
                  name={isMatchPlay ? MATCH_PLAY_ICON : SKINS_ICON}
                  size={12}
                  color={isMatchPlay ? colors.warning : colors.primaryDark}
                />
                <Text style={[styles.badgeText, isMatchPlay && styles.badgeTextMatchPlay]}>
                  {isMatchPlay ? "MATCH PLAY" : "SKINS"}
                </Text>
              </View>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>

            <View style={styles.mainRow}>
              <View style={[styles.resultIcon, isMatchPlay && styles.resultIconMatchPlay]}>
                <Ionicons name={isMatchPlay ? "ribbon" : "trophy"} size={20} color={isMatchPlay ? colors.warning : colors.primaryDark} />
              </View>
              <View style={styles.mainInfo}>
                <Text style={styles.course} numberOfLines={1}>
                  {round.courseName}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.meta}>{round.players.length} players</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name={isMatchPlay ? MATCH_PLAY_ICON : SKINS_ICON} size={12} color={colors.textSecondary} />
                  <Text style={styles.meta}>
                    {scoringMode} {isMatchPlay ? "Match Play" : "Skins"}
                  </Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.meta}>{round.holeCount} holes</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {isMatchPlay ? <MatchPlayFooter round={round} /> : <SkinsFooter round={round} />}
          </Card>
        </Pressable>

        <Pressable
          onPress={() => setShowDeleteConfirm(true)}
          accessibilityRole="button"
          accessibilityLabel="Round options"
          hitSlop={8}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete this round?"
        message={`This will permanently remove the round at ${round.courseName} from your history.`}
        confirmLabel="Delete Round"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteRound(round.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function SkinsFooter({ round }: { round: Round }) {
  const winner = getRoundWinnerSummary(round);
  return (
    <View style={styles.footerRow}>
      <View>
        <Text style={styles.footerLabelGreen}>{winner.name ? "WINNER" : "NO SKINS WON"}</Text>
        <Text style={styles.footerValueBold}>{winner.name ?? "All square"}</Text>
      </View>
      <View style={styles.footerRight}>
        <View style={styles.footerAmountBlock}>
          <Text style={styles.footerLabelGreen}>POT WON</Text>
          <MoneyAmount cents={winner.balanceCents} currency={round.currency} size="lg" />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </View>
  );
}

function MatchPlayFooter({ round }: { round: Round }) {
  const nassau = getNassauSummary(round);

  if (nassau) {
    return (
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.footerLabel}>FORMAT</Text>
          <Text style={styles.footerValueBold}>Nassau</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerRight}>
          <View>
            <Text style={styles.footerLabelGreen}>RESULT</Text>
            <Text style={styles.footerValueBoldGreen}>{nassau.leaderName ? `${nassau.leaderName} won` : "Split result"}</Text>
            <Text style={styles.footerSubtitle}>
              {nassau.decidedCount} of {nassau.totalCount} matches
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  const summary = getMatchPlayResultSummary(round);
  return (
    <View style={styles.footerRowStacked}>
      <View style={styles.footerRowStackedText}>
        <Text style={styles.footerValueBold}>{summary.title}</Text>
        {summary.subtitle ? <Text style={styles.footerSubtitleGreen}>{summary.subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: "relative",
  },
  touchable: {
    minHeight: touchTarget.min,
  },
  pressed: {
    opacity: 0.85,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeMatchPlay: {
    backgroundColor: "#FCF3E1",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.primaryDark,
  },
  badgeTextMatchPlay: {
    color: colors.warning,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginRight: touchTarget.min - 12 + spacing.sm,
  },
  menuButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: touchTarget.min - 12,
    height: touchTarget.min - 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconMatchPlay: {
    backgroundColor: "#FCF3E1",
  },
  mainInfo: {
    flex: 1,
  },
  course: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginHorizontal: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  footerRowStacked: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  footerRowStackedText: {
    flexShrink: 1,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  footerAmountBlock: {
    alignItems: "flex-end",
  },
  footerDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  footerLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  footerLabelGreen: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.3,
  },
  footerValueBold: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  footerValueBoldGreen: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 2,
  },
  footerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  footerSubtitleGreen: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.accent,
    marginTop: 2,
  },
});
