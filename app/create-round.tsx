import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../src/store/useAppStore";
import { AppHeader } from "../src/components/AppHeader";
import { Card } from "../src/components/Card";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { SegmentedControl } from "../src/components/SegmentedControl";
import { StakeSelector } from "../src/features/rounds/StakeSelector";
import { PlayerFormRow, type PlayerDraft } from "../src/features/rounds/PlayerFormRow";
import { CourseSetupSection } from "../src/features/rounds/CourseSetupSection";
import { generateDefaultHoles } from "../src/utils/course";
import { generateId } from "../src/utils/id";
import { colors, fontSize, spacing } from "../src/constants/theme";
import { MAX_PLAYERS, MIN_PLAYERS } from "../src/constants/golf";
import { createHolesArraySchema, gameConfigSchema, playersArraySchema, roundSetupSchema } from "../src/validation/schemas";
import type { Hole, ScoringMode } from "../src/types";

function makeBlankPlayer(): PlayerDraft {
  return { id: generateId("draft"), name: "", handicapText: "0" };
}

export default function CreateRoundScreen() {
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);
  const createRound = useAppStore((s) => s.createRound);

  const [courseName, setCourseName] = useState("");
  const [roundName, setRoundName] = useState("");
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [players, setPlayers] = useState<PlayerDraft[]>([makeBlankPlayer(), makeBlankPlayer()]);
  const [holes, setHoles] = useState<Hole[]>(() => generateDefaultHoles(18));
  const [scoringMode, setScoringMode] = useState<ScoringMode>(settings.defaultScoringMode);
  const [stakePerSkinCents, setStakePerSkinCents] = useState(settings.defaultStakePerSkinCents);
  const [carryoversEnabled, setCarryoversEnabled] = useState(settings.defaultCarryoversEnabled);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [playerErrors, setPlayerErrors] = useState<Record<string, string>>({});

  const defaultName = courseName.trim() ? `Skins at ${courseName.trim()}` : "";

  const handleHoleCountChange = (value: 9 | 18) => {
    setHoleCount(value);
    setHoles(generateDefaultHoles(value));
  };

  const updatePlayer = (id: string, updates: Partial<PlayerDraft>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((prev) => [...prev, makeBlankPlayer()]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= MIN_PLAYERS) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const movePlayer = (index: number, direction: -1 | 1) => {
    setPlayers((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const nextPlayerErrors: Record<string, string> = {};

    const setupResult = roundSetupSchema.safeParse({
      name: roundName.trim() || defaultName || "Skins Round",
      courseName,
      holeCount,
    });
    if (!setupResult.success) {
      const courseIssue = setupResult.error.issues.find((i) => i.path[0] === "courseName");
      if (courseIssue) nextErrors.courseName = courseIssue.message;
    }

    const parsedPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      handicap: parseFloat(p.handicapText) || 0,
    }));
    const playersResult = playersArraySchema.safeParse(parsedPlayers);
    if (!playersResult.success) {
      for (const issue of playersResult.error.issues) {
        if (typeof issue.path[0] === "number") {
          const player = players[issue.path[0]];
          if (player) nextPlayerErrors[player.id] = issue.message;
        } else {
          nextErrors.players = issue.message;
        }
      }
    }

    const configResult = gameConfigSchema.safeParse({ scoringMode, stakePerSkinCents, carryoversEnabled });
    if (!configResult.success) {
      nextErrors.stake = configResult.error.issues[0]?.message ?? "Invalid game settings";
    }

    const holesResult = createHolesArraySchema(holeCount).safeParse(holes);
    if (!holesResult.success) {
      nextErrors.holes = holesResult.error.issues[0]?.message ?? "Check hole setup";
    }

    setErrors(nextErrors);
    setPlayerErrors(nextPlayerErrors);

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextPlayerErrors).length > 0) {
      return;
    }

    createRound({
      name: roundName.trim() || defaultName || "Skins Round",
      courseName: courseName.trim(),
      holeCount,
      players: parsedPlayers.map((p) => ({ name: p.name, handicap: p.handicap })),
      holes,
      scoringMode,
      stakePerSkinCents,
      carryoversEnabled,
      currency: settings.currency,
    });

    const newRound = useAppStore.getState().activeRound;
    if (newRound) {
      router.replace(`/round/${newRound.id}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="New Round" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Round details</Text>

            <Text style={styles.label}>Course name</Text>
            <TextInput
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Green Hills Golf Club"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Course name"
            />
            {errors.courseName ? <Text style={styles.error}>{errors.courseName}</Text> : null}

            <Text style={styles.label}>Round name (optional)</Text>
            <TextInput
              value={roundName}
              onChangeText={setRoundName}
              placeholder={defaultName || "Skins Round"}
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              accessibilityLabel="Round name"
            />

            <Text style={styles.label}>Holes</Text>
            <SegmentedControl
              value={String(holeCount) as "9" | "18"}
              onChange={(v) => handleHoleCountChange(Number(v) as 9 | 18)}
              options={[
                { value: "9", label: "9 holes" },
                { value: "18", label: "18 holes" },
              ]}
            />

            <View style={styles.courseSetupWrapper}>
              <CourseSetupSection holes={holes} onChange={setHoles} error={errors.holes} />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.playersHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Text style={styles.playerCount}>
                {players.length} of {MAX_PLAYERS}
              </Text>
            </View>
            {errors.players ? <Text style={styles.error}>{errors.players}</Text> : null}

            {players.map((player, index) => (
              <PlayerFormRow
                key={player.id}
                player={player}
                index={index}
                canRemove={players.length > MIN_PLAYERS}
                canMoveUp={index > 0}
                canMoveDown={index < players.length - 1}
                onChangeName={(name) => updatePlayer(player.id, { name })}
                onChangeHandicap={(handicapText) => updatePlayer(player.id, { handicapText })}
                onRemove={() => removePlayer(player.id)}
                onMoveUp={() => movePlayer(index, -1)}
                onMoveDown={() => movePlayer(index, 1)}
                error={playerErrors[player.id]}
              />
            ))}

            <SecondaryButton
              label="+ Add player"
              onPress={addPlayer}
              disabled={players.length >= MAX_PLAYERS}
              style={styles.addPlayerButton}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Game settings</Text>

            <Text style={styles.label}>Scoring</Text>
            <SegmentedControl
              value={scoringMode}
              onChange={setScoringMode}
              options={[
                { value: "gross", label: "Gross" },
                { value: "net", label: "Net" },
              ]}
            />

            <Text style={styles.label}>Stake per skin</Text>
            <StakeSelector valueCents={stakePerSkinCents} onChange={setStakePerSkinCents} currency={settings.currency} />
            {errors.stake ? <Text style={styles.error}>{errors.stake}</Text> : null}

            <View style={styles.switchRow}>
              <View style={styles.flexShrink}>
                <Text style={styles.label}>Carryovers</Text>
                <Text style={styles.hint}>Tied holes roll the skin into the next hole.</Text>
              </View>
              <Switch
                value={carryoversEnabled}
                onValueChange={setCarryoversEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                accessibilityLabel="Carryovers enabled"
              />
            </View>
          </Card>

          <Text style={styles.disclaimer}>
            Skins tracks friendly bets and calculates settlements. Payments are handled outside the app.
          </Text>

          <PrimaryButton label="Start Round" onPress={handleSubmit} style={styles.startButton} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  error: {
    color: colors.negative,
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  courseSetupWrapper: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  playersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  addPlayerButton: {
    marginTop: spacing.md,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  flexShrink: {
    flexShrink: 1,
    marginRight: spacing.md,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: spacing.md,
    lineHeight: 18,
  },
  startButton: {
    marginTop: spacing.sm,
  },
});
