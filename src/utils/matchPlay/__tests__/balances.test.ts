import { calculateMatchPlayBalances, calculateNassauBalances } from "../balances";
import type { MatchPlayMatchResult, MatchPlaySide, NassauMatchResult } from "../../../types";

const individualA: MatchPlaySide = { id: "alex", name: "Alex", playerIds: ["alex"] };
const individualB: MatchPlaySide = { id: "ben", name: "Ben", playerIds: ["ben"] };

const teamA: MatchPlaySide = { id: "team_pine", name: "Team Pine", playerIds: ["alex", "ben"] };
const teamB: MatchPlaySide = { id: "team_oak", name: "Team Oak", playerIds: ["chris", "dana"] };

function matchResult(overrides: Partial<MatchPlayMatchResult>): MatchPlayMatchResult {
  return {
    sideAId: "alex",
    sideBId: "ben",
    holeResults: [],
    winnerSideId: null,
    completionHole: null,
    finalStatus: 0,
    resultLabel: "Match Halved",
    isHalved: true,
    ...overrides,
  };
}

describe("calculateMatchPlayBalances — individual", () => {
  it("gives the winner the full stake and the loser the full loss", () => {
    const result = matchResult({ winnerSideId: "alex", isHalved: false, resultLabel: "3 & 2" });
    const balances = calculateMatchPlayBalances(individualA, individualB, result, 2000);
    expect(balances.alex).toBe(2000);
    expect(balances.ben).toBe(-2000);
  });

  it("transfers nothing when the match is halved", () => {
    const result = matchResult({});
    const balances = calculateMatchPlayBalances(individualA, individualB, result, 2000);
    expect(balances.alex).toBe(0);
    expect(balances.ben).toBe(0);
  });
});

describe("calculateMatchPlayBalances — team", () => {
  it("splits the stake equally among the two winning and two losing players", () => {
    const result = matchResult({ sideAId: "team_pine", sideBId: "team_oak", winnerSideId: "team_pine", isHalved: false, resultLabel: "1 Up" });
    const balances = calculateMatchPlayBalances(teamA, teamB, result, 2000);
    expect(balances.alex).toBe(1000);
    expect(balances.ben).toBe(1000);
    expect(balances.chris).toBe(-1000);
    expect(balances.dana).toBe(-1000);
  });

  it("always sums to zero across all four players", () => {
    const result = matchResult({ sideAId: "team_pine", sideBId: "team_oak", winnerSideId: "team_oak", isHalved: false, resultLabel: "2 & 1" });
    const balances = calculateMatchPlayBalances(teamA, teamB, result, 2000);
    const total = Object.values(balances).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(0);
  });
});

function nassauMatch(overrides: Partial<NassauMatchResult>): NassauMatchResult {
  return {
    segment: "front",
    startHole: 1,
    endHole: 9,
    status: 0,
    completed: true,
    winnerSideId: null,
    resultLabel: "Match Halved",
    holeResults: [],
    ...overrides,
  };
}

describe("calculateNassauBalances", () => {
  it("combines three independent match outcomes into one net total per player", () => {
    // Team A wins Front, Team B wins Back, Team A wins Overall -> Team A nets +$10 (stake $10/match).
    const matches: NassauMatchResult[] = [
      nassauMatch({ segment: "front", winnerSideId: "team_pine" }),
      nassauMatch({ segment: "back", winnerSideId: "team_oak" }),
      nassauMatch({ segment: "overall", winnerSideId: "team_pine" }),
    ];
    const balances = calculateNassauBalances(teamA, teamB, matches, 1000);
    expect(balances.alex + balances.ben).toBe(1000); // Team A net +$10
    expect(balances.chris + balances.dana).toBe(-1000); // Team B net -$10
  });

  it("transfers zero for a halved segment", () => {
    const matches: NassauMatchResult[] = [
      nassauMatch({ segment: "front", winnerSideId: null, completed: true }), // halved
      nassauMatch({ segment: "back", winnerSideId: "team_pine" }),
      nassauMatch({ segment: "overall", winnerSideId: "team_pine" }),
    ];
    const balances = calculateNassauBalances(teamA, teamB, matches, 1000);
    // Only 2 of 3 matches transferred money: Team A +$20 total, Team B -$20.
    expect(balances.alex + balances.ben).toBe(2000);
    expect(balances.chris + balances.dana).toBe(-2000);
  });

  it("ignores matches that are not yet completed", () => {
    const matches: NassauMatchResult[] = [
      nassauMatch({ segment: "front", winnerSideId: "team_pine", completed: true }),
      nassauMatch({ segment: "back", winnerSideId: null, completed: false }),
      nassauMatch({ segment: "overall", winnerSideId: null, completed: false }),
    ];
    const balances = calculateNassauBalances(teamA, teamB, matches, 1000);
    expect(balances.alex + balances.ben).toBe(1000);
    expect(balances.chris + balances.dana).toBe(-1000);
  });

  it("always sums to zero across all four players", () => {
    const matches: NassauMatchResult[] = [
      nassauMatch({ segment: "front", winnerSideId: "team_pine" }),
      nassauMatch({ segment: "back", winnerSideId: "team_pine" }),
      nassauMatch({ segment: "overall", winnerSideId: "team_pine" }),
    ];
    const balances = calculateNassauBalances(teamA, teamB, matches, 1000);
    const total = Object.values(balances).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(0);
  });
});
