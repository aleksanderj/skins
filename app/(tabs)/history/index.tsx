import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { EmptyState } from "../../../src/components/EmptyState";
import { SegmentedControl } from "../../../src/components/SegmentedControl";
import { RoundSummaryCard } from "../../../src/features/history/RoundSummaryCard";
import { colors, spacing } from "../../../src/constants/theme";

type FormatFilter = "all" | "skins" | "match_play";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const roundHistory = useAppStore((s) => s.roundHistory);
  const [filter, setFilter] = useState<FormatFilter>("all");

  const filteredRounds = useMemo(() => {
    if (filter === "all") return roundHistory;
    return roundHistory.filter((r) => r.format === filter);
  }, [roundHistory, filter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="History" subtitle={`${roundHistory.length} completed round${roundHistory.length === 1 ? "" : "s"}`} />

      {roundHistory.length > 0 ? (
        <View style={styles.filterWrapper}>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "skins", label: "Skins" },
              { value: "match_play", label: "Match Play" },
            ]}
          />
        </View>
      ) : null}

      {roundHistory.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No rounds yet"
          message="Completed rounds will show up here with final balances and settlements."
        />
      ) : filteredRounds.length === 0 ? (
        <EmptyState icon="filter-outline" title="No rounds match this filter" message="Try a different format filter." />
      ) : (
        <FlatList
          data={filteredRounds}
          keyExtractor={(round) => round.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cardSpacing}>
              <RoundSummaryCard round={item} onPress={() => router.push(`/history/${item.id}`)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  cardSpacing: {
    marginBottom: spacing.sm,
  },
});
