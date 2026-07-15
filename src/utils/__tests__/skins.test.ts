import { calculateHoleWinner, calculateSkinResults } from "../skins";
import { makeHoles, makePlayers, makeRound } from "../../test-utils/roundFactory";

describe("calculateHoleWinner", () => {
  it("picks the lowest score as the winner", () => {
    const result = calculateHoleWinner([
      { playerId: "p1", score: 3 },
      { playerId: "p2", score: 4 },
    ]);
    expect(result).toEqual({ winnerPlayerId: "p1", tiedPlayerIds: [] });
  });

  it("ties when two or more players share the lowest score", () => {
    const result = calculateHoleWinner([
      { playerId: "p1", score: 4 },
      { playerId: "p2", score: 4 },
      { playerId: "p3", score: 5 },
    ]);
    expect(result).toEqual({ winnerPlayerId: null, tiedPlayerIds: ["p1", "p2"] });
  });
});

describe("calculateSkinResults", () => {
  it("resolves a clear single-hole winner", () => {
    const round = makeRound({
      players: makePlayers(2),
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 3 },
        { playerId: "p2", holeNumber: 1, grossScore: 4 },
      ],
    });
    const results = calculateSkinResults(round);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      holeNumber: 1,
      winnerPlayerId: "p1",
      skinsWon: 1,
      monetaryValueCents: 500,
      carriedIntoNextHoleCents: 0,
    });
  });

  it("ties a hole on equal gross scores and carries the skin", () => {
    const round = makeRound({
      players: makePlayers(2),
      carryoversEnabled: true,
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 4 },
      ],
    });
    const results = calculateSkinResults(round);
    expect(results[0]).toMatchObject({
      winnerPlayerId: null,
      tiedPlayerIds: ["p1", "p2"],
      skinsWon: 0,
      monetaryValueCents: 0,
      carriedIntoNextHoleCents: 500,
    });
  });

  it("uses net score to decide a winner when scoring mode is net", () => {
    const round = makeRound({
      scoringMode: "net",
      players: makePlayers(2, [0, 10]),
      holes: makeHoles(18), // stroke index 1 for hole 1 -> handicap 10 gets a stroke here
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 5 },
        { playerId: "p2", holeNumber: 1, grossScore: 5 },
      ],
    });
    const results = calculateSkinResults(round);
    // Gross scores tie at 5, but p2's net score (5 - 1 stroke = 4) wins.
    expect(results[0].winnerPlayerId).toBe("p2");
  });

  it("accumulates a single carryover into the next hole's winner", () => {
    const round = makeRound({
      players: makePlayers(2),
      carryoversEnabled: true,
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 4 },
        { playerId: "p1", holeNumber: 2, grossScore: 3 },
        { playerId: "p2", holeNumber: 2, grossScore: 5 },
      ],
    });
    const results = calculateSkinResults(round);
    expect(results[1]).toMatchObject({
      winnerPlayerId: "p1",
      skinsWon: 2,
      monetaryValueCents: 1000,
    });
  });

  it("accumulates multiple consecutive carryovers", () => {
    const round = makeRound({
      players: makePlayers(2),
      carryoversEnabled: true,
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 4 },
        { playerId: "p1", holeNumber: 2, grossScore: 4 },
        { playerId: "p2", holeNumber: 2, grossScore: 4 },
        { playerId: "p1", holeNumber: 3, grossScore: 3 },
        { playerId: "p2", holeNumber: 3, grossScore: 5 },
      ],
    });
    const results = calculateSkinResults(round);
    expect(results[2]).toMatchObject({
      winnerPlayerId: "p1",
      skinsWon: 3,
      monetaryValueCents: 1500,
    });
  });

  it("leaves the final hole's carryover unresolved when it ties", () => {
    const players = makePlayers(2);
    const scores = [];
    for (let hole = 1; hole <= 8; hole++) {
      scores.push({ playerId: "p1", holeNumber: hole, grossScore: 3 });
      scores.push({ playerId: "p2", holeNumber: hole, grossScore: 4 });
    }
    scores.push({ playerId: "p1", holeNumber: 9, grossScore: 4 });
    scores.push({ playerId: "p2", holeNumber: 9, grossScore: 4 });

    const round = makeRound({
      holeCount: 9,
      players,
      carryoversEnabled: true,
      scores,
    });
    const results = calculateSkinResults(round);
    const finalResult = results[results.length - 1];
    expect(finalResult.holeNumber).toBe(9);
    expect(finalResult.winnerPlayerId).toBeNull();
    expect(finalResult.carriedIntoNextHoleCents).toBe(500);
  });

  it("does not carry skins when carryovers are disabled", () => {
    const round = makeRound({
      players: makePlayers(2),
      carryoversEnabled: false,
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 4 },
        { playerId: "p1", holeNumber: 2, grossScore: 3 },
        { playerId: "p2", holeNumber: 2, grossScore: 5 },
      ],
    });
    const results = calculateSkinResults(round);
    expect(results[0]).toMatchObject({ skinsWon: 0, monetaryValueCents: 0, carriedIntoNextHoleCents: 0 });
    expect(results[1]).toMatchObject({ winnerPlayerId: "p1", skinsWon: 1, monetaryValueCents: 500 });
  });

  it("applies two handicap strokes on a low stroke-index hole for a high handicap", () => {
    const round = makeRound({
      scoringMode: "net",
      players: makePlayers(2, [0, 22]),
      holes: makeHoles(18), // hole 1 has stroke index 1, within the 1-4 range for a second stroke
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 5 }, // net 5
        { playerId: "p2", holeNumber: 1, grossScore: 6 }, // net 6 - 2 = 4
      ],
    });
    const results = calculateSkinResults(round);
    expect(results[0].winnerPlayerId).toBe("p2");
  });

  it("stops at the first hole with an incomplete score", () => {
    const round = makeRound({
      players: makePlayers(2),
      scores: [
        { playerId: "p1", holeNumber: 1, grossScore: 4 },
        { playerId: "p2", holeNumber: 1, grossScore: 5 },
        { playerId: "p1", holeNumber: 2, grossScore: 4 },
        // p2 hole 2 missing
      ],
    });
    const results = calculateSkinResults(round);
    expect(results).toHaveLength(1);
  });
});
