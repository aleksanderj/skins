import React, { useEffect, useState } from "react";
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
import { ConfirmationModal } from "../src/components/ConfirmationModal";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { SegmentedControl } from "../src/components/SegmentedControl";
import { GameFormatCard } from "../src/components/GameFormatCard";
import { StakeSelector } from "../src/features/rounds/StakeSelector";
import { MatchPlaySettingsSection } from "../src/features/rounds/MatchPlaySettingsSection";
import { TeamAssignmentSection } from "../src/features/rounds/TeamAssignmentSection";
import { PlayerFormRow, type PlayerDraft } from "../src/features/rounds/PlayerFormRow";
import { CourseSetupSection } from "../src/features/rounds/CourseSetupSection";
import { ChallengesSetupSection } from "../src/features/rounds/ChallengesSetupSection";
import { generateDefaultHoles } from "../src/utils/course";
import { generateId } from "../src/utils/id";
import { colors, fontSize, spacing } from "../src/constants/theme";
import { MAX_PLAYERS, MIN_PLAYERS } from "../src/constants/golf";
import {
  createHolesArraySchema,
  createMatchPlaySetupSchema,
  gameConfigSchema,
  playersArraySchema,
  roundSetupSchema,
} from "../src/validation/schemas";
import type {
  GameFormat,
  HandicapAllowancePercent,
  Hole,
  MatchPlayMode,
  MatchPlayStructure,
  MatchPlayTieRule,
  ScoringMode,
} from "../src/types";
import type { CreateRoundChallengeInput } from "../src/features/rounds/types";
import { formatCurrency } from "../src/utils/currency";

function makeBlankPlayer(): PlayerDraft {
  return { id: generateId("draft"), name: "", handicapText: "0" };
}

export default function CreateRoundScreen() {
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);
  const createRound = useAppStore((s) => s.createRound);
  const activeRound = useAppStore((s) => s.activeRound);
  const abandonRound = useAppStore((s) => s.abandonRound);
  // The "Start Game" action lives in the tab bar now, reachable from anywhere —
  // so the one-active-round-at-a-time guard has to live here rather than
  // behind the button that used to trigger this screen.
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(!!activeRound);

  const [format, setFormat] = useState<GameFormat>("skins");
  const [courseName, setCourseName] = useState("");
  const [roundName, setRoundName] = useState("");
  const [holeCount, setHoleCount] = useState<9 | 18>(18);
  const [players, setPlayers] = useState<PlayerDraft[]>([makeBlankPlayer(), makeBlankPlayer()]);
  const [holes, setHoles] = useState<Hole[]>(() => generateDefaultHoles(18));

  // Skins settings
  const [scoringMode, setScoringMode] = useState<ScoringMode>(settings.skinsDefaults.scoringMode);
  const [stakePerSkinCents, setStakePerSkinCents] = useState(settings.skinsDefaults.stakePerSkinCents);
  const [carryoversEnabled, setCarryoversEnabled] = useState(settings.skinsDefaults.carryoversEnabled);

  // Match Play settings
  const [matchPlayMode, setMatchPlayMode] = useState<MatchPlayMode>(settings.matchPlayDefaults.mode);
  const [matchPlayScoringMode, setMatchPlayScoringMode] = useState<ScoringMode>(settings.matchPlayDefaults.scoringMode);
  const [handicapAllowancePercent, setHandicapAllowancePercent] = useState<HandicapAllowancePercent>(
    settings.matchPlayDefaults.handicapAllowancePercent
  );
  const [matchPlayStructure, setMatchPlayStructure] = useState<MatchPlayStructure>(settings.matchPlayDefaults.structure);
  const [matchPlayStakeCents, setMatchPlayStakeCents] = useState(settings.matchPlayDefaults.stakeCents);
  const [matchPlayTieRule, setMatchPlayTieRule] = useState<MatchPlayTieRule>(settings.matchPlayDefaults.tieRule);
  const [teamAName, setTeamAName] = useState("Team A");
  const [teamBName, setTeamBName] = useState("Team B");
  const [teamAIds, setTeamAIds] = useState<string[]>([]);
  const [teamBIds, setTeamBIds] = useState<string[]>([]);

  // Challenges (side bets) — optional, format-agnostic
  const [challenges, setChallenges] = useState<CreateRoundChallengeInput[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [playerErrors, setPlayerErrors] = useState<Record<string, string>>({});

  const defaultName = courseName.trim()
    ? `${format === "skins" ? "Skins" : "Match Play"} at ${courseName.trim()}`
    : "";

  // Keep player count and team assignment in sync with format/mode.
  useEffect(() => {
    if (format !== "match_play") return;
    const targetCount = matchPlayMode === "individual" ? 2 : 4;
    setPlayers((prev) => {
      if (prev.length === targetCount) return prev;
      if (prev.length < targetCount) {
        return [...prev, ...Array.from({ length: targetCount - prev.length }, makeBlankPlayer)];
      }
      return prev.slice(0, targetCount);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, matchPlayMode]);

  useEffect(() => {
    if (format !== "match_play" || matchPlayMode !== "team") return;
    if (players.length !== 4) return;
    setTeamAIds([players[0].id, players[1].id]);
    setTeamBIds([players[2].id, players[3].id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, matchPlayMode, players.length]);

  const handleHoleCountChange = (value: 9 | 18) => {
    setHoleCount(value);
    setHoles(generateDefaultHoles(value));
    if (value === 9 && matchPlayStructure === "nassau") {
      setMatchPlayStructure("single_match");
    }
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

  const handleMovePlayerToOtherTeam = (playerId: string) => {
    if (teamAIds.includes(playerId)) {
      const [swapOut, ...restB] = teamBIds;
      setTeamAIds((prev) => [...prev.filter((id) => id !== playerId), ...(swapOut ? [swapOut] : [])]);
      setTeamBIds(swapOut ? [...restB, playerId] : [...teamBIds, playerId]);
    } else if (teamBIds.includes(playerId)) {
      const [swapOut, ...restA] = teamAIds;
      setTeamBIds((prev) => [...prev.filter((id) => id !== playerId), ...(swapOut ? [swapOut] : [])]);
      setTeamAIds(swapOut ? [...restA, playerId] : [...teamAIds, playerId]);
    }
  };

  const handleReorderWithinTeam = (playerId: string, side: "A" | "B", direction: -1 | 1) => {
    const setter = side === "A" ? setTeamAIds : setTeamBIds;
    setter((prev) => {
      const idx = prev.indexOf(playerId);
      const target = idx + direction;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const nextPlayerErrors: Record<string, string> = {};

    const setupResult = roundSetupSchema.safeParse({
      name: roundName.trim() || defaultName || "New Round",
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

    const holesResult = createHolesArraySchema(holeCount).safeParse(holes);
    if (!holesResult.success) {
      nextErrors.holes = holesResult.error.issues[0]?.message ?? "Check hole setup";
    }

    if (format === "skins") {
      const configResult = gameConfigSchema.safeParse({ scoringMode, stakePerSkinCents, carryoversEnabled });
      if (!configResult.success) {
        nextErrors.stake = configResult.error.issues[0]?.message ?? "Invalid game settings";
      }
    } else {
      const teams =
        matchPlayMode === "team"
          ? [
              { id: generateId("team"), name: teamAName.trim() || "Team A", playerIds: teamAIds },
              { id: generateId("team"), name: teamBName.trim() || "Team B", playerIds: teamBIds },
            ]
          : undefined;
      const matchPlayResult = createMatchPlaySetupSchema(holeCount, players.map((p) => p.id)).safeParse({
        mode: matchPlayMode,
        scoringMode: matchPlayScoringMode,
        handicapAllowancePercent,
        stakeCents: matchPlayStakeCents,
        tieRule: matchPlayTieRule,
        structure: matchPlayStructure,
        teams,
      });
      if (!matchPlayResult.success) {
        nextErrors.matchPlay = matchPlayResult.error.issues[0]?.message ?? "Check Match Play settings";
      }
    }

    setErrors(nextErrors);
    setPlayerErrors(nextPlayerErrors);

    if (Object.keys(nextErrors).length > 0 || Object.keys(nextPlayerErrors).length > 0) {
      return;
    }

    createRound({
      name: roundName.trim() || defaultName || "New Round",
      courseName: courseName.trim(),
      holeCount,
      players: parsedPlayers.map((p) => ({ name: p.name, handicap: p.handicap })),
      holes,
      format,
      currency: settings.currency,
      scoringMode,
      stakePerSkinCents,
      carryoversEnabled,
      matchPlayMode,
      matchPlayScoringMode,
      handicapAllowancePercent,
      matchPlayStructure,
      matchPlayStakeCents,
      matchPlayTieRule,
      teamNames: [teamAName.trim() || "Team A", teamBName.trim() || "Team B"],
      teamAssignments: players.map((p) => ({ teamIndex: (teamAIds.includes(p.id) ? 0 : 1) as 0 | 1 })),
      challenges,
    });

    const newRound = useAppStore.getState().activeRound;
    if (newRound) {
      router.replace(`/round/${newRound.id}`);
    }
  };

  const maxPlayersForFormat = format === "match_play" && matchPlayMode === "individual" ? 2 : format === "match_play" ? 4 : MAX_PLAYERS;
  const minPlayersForFormat = format === "match_play" ? maxPlayersForFormat : MIN_PLAYERS;
  const playersLocked = format === "match_play";

  const handleDiscardAndContinue = () => {
    abandonRound();
    setShowDiscardConfirm(false);
  };

  const handleKeepPlaying = () => {
    setShowDiscardConfirm(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AppHeader title="New Round" onBack={() => router.back()} />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Game format</Text>
            <GameFormatCard
              icon="golf"
              title="Skins"
              description="Win individual holes and carry tied skins forward."
              selected={format === "skins"}
              onPress={() => setFormat("skins")}
            />
            <GameFormatCard
              icon="trophy"
              title="Match Play"
              description="Win holes to go up in the match."
              selected={format === "match_play"}
              onPress={() => setFormat("match_play")}
            />
          </Card>

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
              placeholder={defaultName || "New Round"}
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
                {players.length} of {playersLocked ? maxPlayersForFormat : MAX_PLAYERS}
              </Text>
            </View>
            {errors.players ? <Text style={styles.error}>{errors.players}</Text> : null}
            {playersLocked ? (
              <Text style={styles.hint}>
                {matchPlayMode === "individual" ? "Individual Match Play needs exactly 2 players." : "Team Match Play needs exactly 4 players."}
              </Text>
            ) : null}

            {players.map((player, index) => (
              <PlayerFormRow
                key={player.id}
                player={player}
                index={index}
                canRemove={!playersLocked && players.length > MIN_PLAYERS}
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

            {!playersLocked ? (
              <SecondaryButton
                label="+ Add player"
                onPress={addPlayer}
                disabled={players.length >= MAX_PLAYERS}
                style={styles.addPlayerButton}
              />
            ) : null}
          </Card>

          {format === "match_play" && matchPlayMode === "team" ? (
            <Card style={styles.card}>
              <TeamAssignmentSection
                players={players}
                teamAIds={teamAIds}
                teamBIds={teamBIds}
                teamAName={teamAName}
                teamBName={teamBName}
                onChangeTeamAName={setTeamAName}
                onChangeTeamBName={setTeamBName}
                onMovePlayer={handleMovePlayerToOtherTeam}
                onReorder={handleReorderWithinTeam}
                error={errors.matchPlay}
              />
            </Card>
          ) : null}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Game settings</Text>

            {format === "skins" ? (
              <>
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
              </>
            ) : (
              <>
                <MatchPlaySettingsSection
                  mode={matchPlayMode}
                  onModeChange={setMatchPlayMode}
                  scoringMode={matchPlayScoringMode}
                  onScoringModeChange={setMatchPlayScoringMode}
                  handicapAllowancePercent={handicapAllowancePercent}
                  onHandicapAllowanceChange={setHandicapAllowancePercent}
                  structure={matchPlayStructure}
                  onStructureChange={setMatchPlayStructure}
                  holeCount={holeCount}
                  stakeCents={matchPlayStakeCents}
                  onStakeChange={setMatchPlayStakeCents}
                  tieRule={matchPlayTieRule}
                  onTieRuleChange={setMatchPlayTieRule}
                  currency={settings.currency}
                />
                {errors.matchPlay ? <Text style={styles.error}>{errors.matchPlay}</Text> : null}

                <View style={styles.exposureBox}>
                  {matchPlayStructure === "single_match" ? (
                    <Text style={styles.exposureText}>
                      Match value: {formatCurrency(matchPlayStakeCents, settings.currency)}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.exposureText}>
                        Three matches at {formatCurrency(matchPlayStakeCents, settings.currency)} each
                      </Text>
                      <Text style={styles.exposureSubtext}>
                        Maximum total exposure: {formatCurrency(matchPlayStakeCents * 3, settings.currency)}
                      </Text>
                    </>
                  )}
                </View>
              </>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Challenges</Text>
            <ChallengesSetupSection
              challenges={challenges}
              onChange={setChallenges}
              holes={holes}
              holeCount={holeCount}
              currency={settings.currency}
            />
          </Card>

          <Text style={styles.disclaimer}>
            The app tracks friendly bets and calculates settlements. Payments are handled outside the app.
          </Text>

          <PrimaryButton label="Start Round" onPress={handleSubmit} style={styles.startButton} />
        </ScrollView>
      </View>

      <ConfirmationModal
        visible={showDiscardConfirm}
        title="Discard active round?"
        message="Starting a new round will discard your in-progress round. This can't be undone."
        confirmLabel="Discard & Start New"
        cancelLabel="Keep Playing"
        destructive
        onConfirm={handleDiscardAndContinue}
        onCancel={handleKeepPlaying}
      />
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
  exposureBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.light,
  },
  exposureText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  exposureSubtext: {
    fontSize: fontSize.sm,
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
