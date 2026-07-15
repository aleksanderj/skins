import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../../../src/store/useAppStore";
import { AppHeader } from "../../../src/components/AppHeader";
import { EmptyState } from "../../../src/components/EmptyState";
import { RoundSummaryCard } from "../../../src/features/history/RoundSummaryCard";
import { colors, spacing } from "../../../src/constants/theme";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const roundHistory = useAppStore((s) => s.roundHistory);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="History" subtitle={`${roundHistory.length} completed round${roundHistory.length === 1 ? "" : "s"}`} />

      {roundHistory.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No rounds yet"
          message="Completed rounds will show up here with final balances and settlements."
        />
      ) : (
        <FlatList
          data={roundHistory}
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
  list: {
    padding: spacing.lg,
  },
  cardSpacing: {
    marginBottom: spacing.sm,
  },
});
