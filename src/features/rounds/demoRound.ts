import { generateDefaultHoles } from "../../utils/course";
import type { CreateRoundInput } from "./types";

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
