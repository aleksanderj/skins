import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../../src/store/useAppStore";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { SecondaryButton } from "../../src/components/SecondaryButton";
import { EmptyState } from "../../src/components/EmptyState";
import { ConfirmationModal } from "../../src/components/ConfirmationModal";
import { ActiveRoundCard } from "../../src/features/rounds/ActiveRoundCard";
import { RoundSummaryCard } from "../../src/features/history/RoundSummaryCard";
import { colors, fontSize, spacing } from "../../src/constants/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const activeRound = useAppStore((s) => s.activeRound);
  const roundHistory = useAppStore((s) => s.roundHistory);
  const abandonRound = useAppStore((s) => s.abandonRound);
  const loadDemoRound = useAppStore((s) => s.loadDemoRound);
  const loadIndividualMatchPlayDemo = useAppStore((s) => s.loadIndividualMatchPlayDemo);
  const loadTeamNassauDemo = useAppStore((s) => s.loadTeamNassauDemo);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const recentRounds = roundHistory.slice(0, 4);

  const handleStartRound = () => {
    if (activeRound) {
      setShowDiscardConfirm(true);
      return;
    }
    router.push("/create-round");
  };

  const confirmDiscardAndStart = () => {
    abandonRound();
    setShowDiscardConfirm(false);
    router.push("/create-round");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.appName}>Skins</Text>
          <Text style={styles.tagline}>Play the round. We handle the math.</Text>
        </View>

        <PrimaryButton label="Start a Game" onPress={handleStartRound} style={styles.cta} />

        {__DEV__ ? (
          <View style={styles.demoButtonGroup}>
            <SecondaryButton label="Load Skins Demo" onPress={loadDemoRound} style={styles.demoButton} />
            <SecondaryButton label="Load Individual Match Demo" onPress={loadIndividualMatchPlayDemo} style={styles.demoButton} />
            <SecondaryButton label="Load Team Nassau Demo" onPress={loadTeamNassauDemo} style={styles.demoButton} />
          </View>
        ) : null}

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
            message="Start a Skins or Match Play game to add players, enter scores, and see who owes who."
          />
        ) : null}
      </ScrollView>

      <ConfirmationModal
        visible={showDiscardConfirm}
        title="Discard active round?"
        message="Starting a new round will discard your in-progress round. This can't be undone."
        confirmLabel="Discard & Start New"
        cancelLabel="Keep Playing"
        destructive
        onConfirm={confirmDiscardAndStart}
        onCancel={() => setShowDiscardConfirm(false)}
      />
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
  cta: {
    marginBottom: spacing.md,
  },
  demoButtonGroup: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  demoButton: {
    marginBottom: 0,
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
