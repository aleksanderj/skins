import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../src/store/useAppStore";
import { useToastStore } from "../src/store/useToastStore";
import { AppHeader } from "../src/components/AppHeader";
import { Card } from "../src/components/Card";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { colors, fontSize, spacing } from "../src/constants/theme";

/** Dev-only utility screen: load an in-progress demo round to play through, or drop a fully-scored completed round straight into History for testing. Never shown outside __DEV__ (see the Settings screen's entry point). */
export default function DevToolsScreen() {
  const insets = useSafeAreaInsets();
  const loadDemoRound = useAppStore((s) => s.loadDemoRound);
  const loadIndividualMatchPlayDemo = useAppStore((s) => s.loadIndividualMatchPlayDemo);
  const loadTeamNassauDemo = useAppStore((s) => s.loadTeamNassauDemo);
  const loadCompletedDemoRound = useAppStore((s) => s.loadCompletedDemoRound);

  const startActiveDemo = (load: () => void) => {
    load();
    const newRound = useAppStore.getState().activeRound;
    if (newRound) {
      router.push(`/round/${newRound.id}`);
    }
  };

  const addCompletedDemo = (kind: "skins" | "individual_match_play" | "team_nassau", label: string) => {
    loadCompletedDemoRound(kind);
    useToastStore.getState().showToast(`${label} added to History`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="Developer Tools" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}>
        <Text style={styles.groupTitle}>Load Active Round</Text>
        <Text style={styles.hint}>Starts an in-progress round and jumps into hole-by-hole scoring.</Text>
        <Card style={styles.card}>
          <View style={styles.buttonGroup}>
            <SecondaryButton
              label="Load Skins Demo"
              onPress={() => startActiveDemo(loadDemoRound)}
              style={styles.button}
            />
            <SecondaryButton
              label="Load Individual Match Demo"
              onPress={() => startActiveDemo(loadIndividualMatchPlayDemo)}
              style={styles.button}
            />
            <SecondaryButton
              label="Load Team Nassau Demo"
              onPress={() => startActiveDemo(loadTeamNassauDemo)}
              style={styles.button}
            />
          </View>
        </Card>

        <Text style={styles.groupTitle}>Add Completed Round to History</Text>
        <Text style={styles.hint}>
          Fills every hole with deterministic scores and drops a finished round straight into History — no need to
          play it out by hand.
        </Text>
        <Card style={styles.card}>
          <View style={styles.buttonGroup}>
            <SecondaryButton
              label="Add Completed Skins Round"
              onPress={() => addCompletedDemo("skins", "Skins round")}
              style={styles.button}
            />
            <SecondaryButton
              label="Add Completed Individual Match"
              onPress={() => addCompletedDemo("individual_match_play", "Individual match")}
              style={styles.button}
            />
            <SecondaryButton
              label="Add Completed Team Nassau"
              onPress={() => addCompletedDemo("team_nassau", "Team Nassau round")}
              style={styles.button}
            />
          </View>
        </Card>
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
  groupTitle: {
    fontSize: fontSize.sm,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: spacing.md,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    marginBottom: spacing.md,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
  button: {
    marginBottom: 0,
  },
});
