import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../../src/store/useAppStore";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { EmptyState } from "../../src/components/EmptyState";
import { ActiveRoundCard } from "../../src/features/rounds/ActiveRoundCard";
import { RoundSummaryCard } from "../../src/features/history/RoundSummaryCard";
import { colors, fontSize, spacing } from "../../src/constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const activeRound = useAppStore((s) => s.activeRound);
  const roundHistory = useAppStore((s) => s.roundHistory);

  const recentRounds = roundHistory.slice(0, 4);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.appName}>Skins</Text>
          <Text style={styles.tagline}>Play the round. We handle the math.</Text>
        </View>

        {activeRound ? (
          <ActiveRoundCard round={activeRound} onResume={() => router.push(`/round/${activeRound.id}`)} />
        ) : null}

        {recentRounds.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent rounds</Text>
              <SecondaryButton
                label="See all"
                onPress={() => router.push("/history")}
                style={styles.seeAllButton}
              />
            </View>
            {recentRounds.map((round) => (
              <View key={round.id} style={styles.cardSpacing}>
                <RoundSummaryCard round={round} onPress={() => router.push(`/history/${round.id}`)} />
              </View>
            ))}
          </View>
        ) : !activeRound ? (
          <EmptyState
            icon="golf-outline"
            title="Ready for your first round"
            message="Tap Start Game below to add players, enter scores, and see who owes who."
          />
        ) : null}
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
  },
  hero: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minHeight: 0,
  },
  cardSpacing: {
    marginBottom: spacing.sm,
  },
});
