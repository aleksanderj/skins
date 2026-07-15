import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../constants/theme";

export type MatchProgressEntry = {
  holeNumber: number;
  /** "A" won, "B" won, or null for a halved hole. */
  winner: "A" | "B" | null;
};

type Props = {
  entries: MatchProgressEntry[];
  sideAInitial: string;
  sideBInitial: string;
};

/** Compact hole-by-hole result strip: A / B / halved per hole, scrollable for 18 holes. */
export function MatchProgressStrip({ entries, sideAInitial, sideBInitial }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {entries.map((entry) => {
          const label =
            entry.winner === "A"
              ? `Hole ${entry.holeNumber}: ${sideAInitial} won`
              : entry.winner === "B"
                ? `Hole ${entry.holeNumber}: ${sideBInitial} won`
                : `Hole ${entry.holeNumber}: halved`;
          const symbol = entry.winner === "A" ? sideAInitial : entry.winner === "B" ? sideBInitial : "–";

          return (
            <View key={entry.holeNumber} style={styles.cell} accessibilityLabel={label}>
              <Text style={styles.holeNumber}>{entry.holeNumber}</Text>
              <View
                style={[
                  styles.symbolBox,
                  entry.winner === "A" && styles.symbolBoxA,
                  entry.winner === "B" && styles.symbolBoxB,
                ]}
              >
                <Text
                  style={[
                    styles.symbolText,
                    (entry.winner === "A" || entry.winner === "B") && styles.symbolTextActive,
                  ]}
                >
                  {symbol}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  cell: {
    alignItems: "center",
    width: 32,
  },
  holeNumber: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  symbolBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolBoxA: {
    backgroundColor: colors.primaryDark,
  },
  symbolBoxB: {
    backgroundColor: colors.warning,
  },
  symbolText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  symbolTextActive: {
    color: colors.white,
  },
});
