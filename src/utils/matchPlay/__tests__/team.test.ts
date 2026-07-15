import { calculateMatchPlayRoundResult } from "../round";
import { calculateRelativeMatchPlayHandicaps } from "../handicap";
import { getMatchPlaySides } from "../sides";
import { makeHoleScores, makeMatchPlayRound, makePlayers, makeTeams } from "../../../test-utils/roundFactory";
import { createMatchPlaySetupSchema } from "../../../validation/schemas";

function teamRound(overrides: Parameters<typeof makeMatchPlayRound>[0] = {}) {
  const players = makePlayers(4, [5, 10, 14, 18]);
  const teams = makeTeams([players[0], players[1]], [players[2], players[3]], "Team Pine", "Team Oak");
  return makeMatchPlayRound({ players, matchPlayMode: "team", teams, ...overrides });
}

describe("Team Match Play — hole scoring", () => {
  it("counts the lowest score recorded by either team member", () => {
    const round = teamRound({
      scores: makeHoleScores(["p1", "p2", "p3", "p4"], [[6, 3, 4, 5]]), // Pine best=3, Oak best=4
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.holeResults[0]).toMatchObject({
      sideAScore: 3,
      sideBScore: 4,
      winnerSideId: "team_a",
    });
  });

  it("lets a different team member carry the win on different holes", () => {
    const round = teamRound({
      scores: makeHoleScores(
        ["p1", "p2", "p3", "p4"],
        [
          [3, 6, 4, 5], // hole 1: p1 (Pine) carries it
          [6, 3, 4, 5], // hole 2: p2 (Pine) carries it
        ]
      ),
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.holeResults[0].sideAScore).toBe(3);
    expect(result?.singleMatch?.holeResults[1].sideAScore).toBe(3);
    expect(result?.singleMatch?.holeResults[0].winnerSideId).toBe("team_a");
    expect(result?.singleMatch?.holeResults[1].winnerSideId).toBe("team_a");
  });

  it("halves a hole when both teams' best scores are equal", () => {
    const round = teamRound({
      scores: makeHoleScores(["p1", "p2", "p3", "p4"], [[6, 4, 4, 7]]), // both best scores are 4
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.holeResults[0]).toMatchObject({ winnerSideId: null, statusAfterHole: 0 });
  });
});

describe("Team Match Play — handicaps", () => {
  it("computes every player's handicap relative to the lowest of all four", () => {
    const players = makePlayers(4, [5, 10, 14, 18]);
    const relative = calculateRelativeMatchPlayHandicaps(players, 18, 100);
    expect(relative).toEqual({ p1: 0, p2: 5, p3: 9, p4: 13 });
  });
});

describe("Team Match Play — assignment validation", () => {
  it("assigns all four players to a team exactly once", () => {
    const players = makePlayers(4);
    const teams = makeTeams([players[0], players[1]], [players[2], players[3]]);
    const sides = getMatchPlaySides(players, {
      mode: "team",
      scoringMode: "gross",
      handicapAllowancePercent: 100,
      stakeCents: 2000,
      tieRule: "halve",
      structure: "single_match",
      teams,
    });
    expect(sides?.sideA.playerIds).toEqual(["p1", "p2"]);
    expect(sides?.sideB.playerIds).toEqual(["p3", "p4"]);
  });

  it("rejects a player appearing on both teams", () => {
    const players = makePlayers(4);
    const schema = createMatchPlaySetupSchema(18, players.map((p) => p.id));
    const result = schema.safeParse({
      mode: "team",
      scoringMode: "gross",
      handicapAllowancePercent: 100,
      stakeCents: 2000,
      tieRule: "halve",
      structure: "single_match",
      teams: [
        { id: "a", name: "Team A", playerIds: ["p1", "p2"] },
        { id: "b", name: "Team B", playerIds: ["p2", "p3"] }, // p2 duplicated, p4 missing
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a team that doesn't have exactly two players", () => {
    const players = makePlayers(4);
    const schema = createMatchPlaySetupSchema(18, players.map((p) => p.id));
    const result = schema.safeParse({
      mode: "team",
      scoringMode: "gross",
      handicapAllowancePercent: 100,
      stakeCents: 2000,
      tieRule: "halve",
      structure: "single_match",
      teams: [
        { id: "a", name: "Team A", playerIds: ["p1", "p2", "p3"] },
        { id: "b", name: "Team B", playerIds: ["p4"] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects individual mode with more than two players", () => {
    const players = makePlayers(3);
    const schema = createMatchPlaySetupSchema(18, players.map((p) => p.id));
    const result = schema.safeParse({
      mode: "individual",
      scoringMode: "gross",
      handicapAllowancePercent: 100,
      stakeCents: 2000,
      tieRule: "halve",
      structure: "single_match",
    });
    expect(result.success).toBe(false);
  });
});
