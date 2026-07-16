import { generateDefaultHoles } from "../../utils/course";
import type { CreateRoundInput } from "./types";
import type { Hole, PlayerHoleScore } from "../../types";

/** Best to worst, indexed by player position — a gentle overall trend, not a hole-by-hole guarantee. */
const SKILL_OFFSETS = [-1, 0, 1, 2];

/** Deterministic pseudo-noise in [-2, 2], varying by both player and hole so rank order isn't fixed every hole. */
function holeNoise(playerIndex: number, holeIndex: number): number {
  const x = Math.sin(holeIndex * 12.9898 + playerIndex * 78.233) * 43758.5453;
  const fraction = x - Math.floor(x);
  return Math.round(fraction * 4) - 2;
}

/**
 * Dev-only: fills every hole for every player with a plausible, deterministic
 * gross score (par + a per-player skill offset + per-player-per-hole noise),
 * so a "completed round" test fixture doesn't require playing 9 or 18 holes
 * by hand. The noise is large enough relative to the skill gap that hole-by-
 * hole results vary and occasionally flip, while the skill trend still
 * decides the round/match over a full 9 or 18 holes.
 */
export function generateDemoScores(players: { id: string }[], holes: Hole[]): PlayerHoleScore[] {
  const scores: PlayerHoleScore[] = [];
  holes.forEach((hole, holeIndex) => {
    players.forEach((player, playerIndex) => {
      const skill = SKILL_OFFSETS[playerIndex % SKILL_OFFSETS.length];
      scores.push({
        playerId: player.id,
        holeNumber: hole.number,
        grossScore: Math.max(1, hole.par + skill + holeNoise(playerIndex, holeIndex)),
      });
    });
  });
  return scores;
}

/** Dev-only seed data so the primary Skins flow can be exercised without manual setup. */
export function buildDemoRoundInput(): CreateRoundInput {
  return {
    name: "Skins at Green Hills Golf Club",
    courseName: "Green Hills Golf Club",
    holeCount: 9,
    format: "skins",
    scoringMode: "net",
    stakePerSkinCents: 500,
    carryoversEnabled: true,
    currency: "USD",
    holes: generateDefaultHoles(9),
    players: [
      { name: "Alex", handicap: 8 },
      { name: "Ben", handicap: 14 },
      { name: "Chris", handicap: 20 },
      { name: "Dana", handicap: 5 },
    ],
  };
}

/** Dev-only seed: Individual Match Play with a sudden-death tie rule. */
export function buildIndividualMatchPlayDemoInput(): CreateRoundInput {
  return {
    name: "Match Play at Green Hills Golf Club",
    courseName: "Green Hills Golf Club",
    holeCount: 18,
    format: "match_play",
    currency: "USD",
    holes: generateDefaultHoles(18),
    players: [
      { name: "Alex", handicap: 8 },
      { name: "Ben", handicap: 14 },
    ],
    matchPlayMode: "individual",
    matchPlayScoringMode: "net",
    handicapAllowancePercent: 100,
    matchPlayStructure: "single_match",
    matchPlayStakeCents: 2000,
    matchPlayTieRule: "playoff",
  };
}

/** Dev-only seed: Team Match Play with a Nassau structure. */
export function buildTeamNassauDemoInput(): CreateRoundInput {
  return {
    name: "Match Play at Lakeside Golf Club",
    courseName: "Lakeside Golf Club",
    holeCount: 18,
    format: "match_play",
    currency: "USD",
    holes: generateDefaultHoles(18),
    players: [
      { name: "Alex", handicap: 8 },
      { name: "Ben", handicap: 14 },
      { name: "Chris", handicap: 20 },
      { name: "Dana", handicap: 5 },
    ],
    matchPlayMode: "team",
    matchPlayScoringMode: "net",
    handicapAllowancePercent: 90,
    matchPlayStructure: "nassau",
    matchPlayStakeCents: 1000,
    matchPlayTieRule: "halve",
    teamNames: ["Team Pine", "Team Oak"],
    teamAssignments: [{ teamIndex: 0 }, { teamIndex: 0 }, { teamIndex: 1 }, { teamIndex: 1 }],
  };
}
