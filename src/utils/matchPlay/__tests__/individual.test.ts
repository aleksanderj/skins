import { calculateMatchPlayRoundResult } from "../round";
import { calculatePlayoffHoleResults } from "../playoff";
import { makeHoleScores, makeMatchPlayRound, makePlayers } from "../../../test-utils/roundFactory";

describe("Individual Match Play — hole scoring", () => {
  it("resolves a clear gross hole win", () => {
    const players = makePlayers(2);
    const round = makeMatchPlayRound({
      players,
      matchPlayScoringMode: "gross",
      scores: makeHoleScores(["p1", "p2"], [[3, 4]]),
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.holeResults[0]).toMatchObject({ winnerSideId: "p1", statusAfterHole: 1 });
  });

  it("resolves a net hole win driven by handicap strokes", () => {
    const players = makePlayers(2, [0, 10]);
    const round = makeMatchPlayRound({
      players,
      matchPlayScoringMode: "net",
      handicapAllowancePercent: 100,
      scores: makeHoleScores(["p1", "p2"], [[5, 5]]), // tied on gross
    });
    const result = calculateMatchPlayRoundResult(round);
    // p2's relative handicap is 10, so hole 1 (stroke index 1) gets a stroke -> net 4 beats p1's net 5.
    expect(result?.singleMatch?.holeResults[0]).toMatchObject({ winnerSideId: "p2" });
  });

  it("halves a tied hole", () => {
    const players = makePlayers(2);
    const round = makeMatchPlayRound({
      players,
      scores: makeHoleScores(["p1", "p2"], [[4, 4]]),
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.holeResults[0]).toMatchObject({ winnerSideId: null, statusAfterHole: 0 });
  });
});

describe("Individual Match Play — match outcomes", () => {
  it("ends 3 & 2 when a 3-hole lead becomes unassailable with 2 to play", () => {
    const players = makePlayers(2);
    // Holes 1-3: p1 wins. Holes 4-16: halved. (Holes 17-18 unscored — match already decided.)
    const grid: Array<[number, number]> = [
      [3, 4],
      [3, 4],
      [3, 4],
      ...Array.from({ length: 13 }, () => [4, 4] as [number, number]),
    ];
    const round = makeMatchPlayRound({ players, scores: makeHoleScores(["p1", "p2"], grid) });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.resultLabel).toBe("3 & 2");
    expect(result?.singleMatch?.completionHole).toBe(16);
    expect(result?.singleMatch?.winnerSideId).toBe("p1");
  });

  it("ends 1 Up when decided on the 18th hole", () => {
    const players = makePlayers(2);
    const grid: Array<[number, number]> = [...Array.from({ length: 17 }, () => [4, 4] as [number, number]), [3, 4]];
    const round = makeMatchPlayRound({ players, scores: makeHoleScores(["p1", "p2"], grid) });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.resultLabel).toBe("1 Up");
    expect(result?.singleMatch?.completionHole).toBe(18);
  });

  it("halves the match when regulation ends all square", () => {
    const players = makePlayers(2);
    const grid: Array<[number, number]> = Array.from({ length: 18 }, () => [4, 4]);
    const round = makeMatchPlayRound({ players, matchPlayTieRule: "halve", scores: makeHoleScores(["p1", "p2"], grid) });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.isHalved).toBe(true);
    expect(result?.singleMatch?.resultLabel).toBe("Match Halved");
  });

  it("becomes Dormie when the lead exactly equals the holes remaining", () => {
    const players = makePlayers(2);
    // p1 wins holes 1-2 (2 up), holes 3-16 halved -> 2 up with 2 to play after hole 16.
    const grid: Array<[number, number]> = [
      [3, 4],
      [3, 4],
      ...Array.from({ length: 14 }, () => [4, 4] as [number, number]),
    ];
    const round = makeMatchPlayRound({ players, scores: makeHoleScores(["p1", "p2"], grid) });
    const result = calculateMatchPlayRoundResult(round);
    const hole16 = result?.singleMatch?.holeResults.find((h) => h.holeNumber === 16);
    expect(hole16).toMatchObject({ isDormie: true, isMatchComplete: false, statusAfterHole: 2 });
  });
});

describe("Individual Match Play — sudden-death playoff", () => {
  it("goes to a playoff after a halved regulation match and finds a winner", () => {
    const players = makePlayers(2);
    const grid: Array<[number, number]> = Array.from({ length: 18 }, () => [4, 4]);
    let round = makeMatchPlayRound({
      players,
      matchPlayTieRule: "playoff",
      scores: makeHoleScores(["p1", "p2"], grid),
      matchPlayPlayoffScores: makeHoleScores(["p1", "p2"], [[3, 4]]),
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.singleMatch?.isHalved).toBe(false);
    expect(result?.singleMatch?.winnerSideId).toBe("p1");
    expect(result?.singleMatch?.resultLabel).toBe("Won on Playoff Hole 1");
    expect(result?.playoffResults).toHaveLength(1);
  });

  it("continues through multiple tied playoff holes before a winner emerges", () => {
    const players = makePlayers(2);
    const grid: Array<[number, number]> = Array.from({ length: 18 }, () => [4, 4]);
    const round = makeMatchPlayRound({
      players,
      matchPlayTieRule: "playoff",
      scores: makeHoleScores(["p1", "p2"], grid),
      matchPlayPlayoffScores: makeHoleScores(["p1", "p2"], [
        [4, 4],
        [4, 4],
        [3, 5],
      ]),
    });
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.playoffResults).toHaveLength(3);
    expect(result?.playoffResults?.[0].winnerSideId).toBeNull();
    expect(result?.playoffResults?.[1].winnerSideId).toBeNull();
    expect(result?.playoffResults?.[2].winnerSideId).toBe("p1");
    expect(result?.singleMatch?.resultLabel).toBe("Won on Playoff Hole 3");
  });

  it("reuses course holes from Hole 1 again for playoff stroke index / par context", () => {
    const players = makePlayers(2, [0, 8]);
    const grid: Array<[number, number]> = Array.from({ length: 18 }, () => [4, 4]);
    const round = makeMatchPlayRound({
      players,
      matchPlayScoringMode: "net",
      matchPlayTieRule: "playoff",
      scores: makeHoleScores(["p1", "p2"], grid),
      matchPlayPlayoffScores: makeHoleScores(["p1", "p2"], [[4, 4]]), // p2 gets a stroke on hole 1 (SI 1)
    });
    const playoffResults = calculatePlayoffHoleResults(
      round,
      { id: "p1", name: "Player 1", playerIds: ["p1"] },
      { id: "p2", name: "Player 2", playerIds: ["p2"] },
      { p1: 0, p2: 8 }
    );
    expect(playoffResults[0]).toMatchObject({ sourceHoleNumber: 1, winnerSideId: "p2" });
  });
});
