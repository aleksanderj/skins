import { calculateMatchPlayRoundResult } from "../round";
import { createMatchPlaySetupSchema } from "../../../validation/schemas";
import { makeHoleScores, makeMatchPlayRound, makePlayers } from "../../../test-utils/roundFactory";

function nassauRound(grid: Array<[number, number]>) {
  const players = makePlayers(2);
  return makeMatchPlayRound({
    players,
    matchPlayStructure: "nassau",
    holeCount: 18,
    scores: makeHoleScores(["p1", "p2"], grid),
  });
}

describe("Nassau", () => {
  it("calculates the Front Nine independently of the other segments", () => {
    // p1 wins holes 1-3, rest halved through hole 9.
    const grid: Array<[number, number]> = [
      [3, 4],
      [3, 4],
      [3, 4],
      ...Array.from({ length: 6 }, () => [4, 4] as [number, number]),
    ];
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const front = result?.nassauMatches?.find((m) => m.segment === "front");
    expect(front?.completed).toBe(true);
    expect(front?.winnerSideId).toBe("p1");
  });

  it("resets the Back Nine to All Square starting at Hole 10", () => {
    // Front nine: p1 wins every hole (would be way up if status carried over).
    // Back nine: all halved. Back should read All Square, not carry the front's lead.
    const grid: Array<[number, number]> = [
      ...Array.from({ length: 9 }, () => [3, 4] as [number, number]),
      ...Array.from({ length: 9 }, () => [4, 4] as [number, number]),
    ];
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const back = result?.nassauMatches?.find((m) => m.segment === "back");
    expect(back?.status).toBe(0);
    expect(back?.completed).toBe(true); // fully played and halved
    expect(back?.resultLabel).toBe("Match Halved");
  });

  it("tracks the Overall match across all 18 holes independent of front/back results", () => {
    // Front: p1 wins 2&1 style lead then halved rest. Back: p2 wins outright.
    const grid: Array<[number, number]> = [
      [3, 4],
      [3, 4],
      ...Array.from({ length: 7 }, () => [4, 4] as [number, number]), // front nine: p1 2 up (not decided early)
      ...Array.from({ length: 9 }, () => [5, 3] as [number, number]), // back nine: p2 wins every hole
    ];
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const overall = result?.nassauMatches?.find((m) => m.segment === "overall");
    // p1 +2 from front, p2 +9 from back -> overall finishes p2 up by 7, decided before hole 18.
    expect(overall?.winnerSideId).toBe("p2");
    expect(overall?.completed).toBe(true);
  });

  it("lets one side sweep all three matches", () => {
    const grid: Array<[number, number]> = Array.from({ length: 18 }, () => [3, 4]);
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    expect(result?.nassauMatches?.every((m) => m.winnerSideId === "p1")).toBe(true);
  });

  it("lets each side win one match while Overall halves", () => {
    // Front: p1 wins every hole. Back: p2 wins every hole. Overall: 9-9 net -> halved.
    const grid: Array<[number, number]> = [
      ...Array.from({ length: 9 }, () => [3, 4] as [number, number]),
      ...Array.from({ length: 9 }, () => [4, 3] as [number, number]),
    ];
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const front = result?.nassauMatches?.find((m) => m.segment === "front");
    const back = result?.nassauMatches?.find((m) => m.segment === "back");
    const overall = result?.nassauMatches?.find((m) => m.segment === "overall");
    expect(front?.winnerSideId).toBe("p1");
    expect(back?.winnerSideId).toBe("p2");
    expect(overall?.resultLabel).toBe("Match Halved");
  });

  it("completes the Front Nine early when mathematically decided", () => {
    // p1 wins holes 1-5 outright -> 5 up with 4 to play after hole 5, decided immediately.
    const grid: Array<[number, number]> = Array.from({ length: 5 }, () => [3, 4] as [number, number]);
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const front = result?.nassauMatches?.find((m) => m.segment === "front");
    expect(front?.completed).toBe(true);
    expect(front?.winnerSideId).toBe("p1");
    expect(front?.holeResults.length).toBeLessThan(9);
  });

  it("completes the Overall match early when mathematically decided", () => {
    const grid: Array<[number, number]> = Array.from({ length: 13 }, () => [3, 4] as [number, number]);
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const overall = result?.nassauMatches?.find((m) => m.segment === "overall");
    expect(overall?.completed).toBe(true);
    expect(overall?.holeResults.length).toBeLessThanOrEqual(13);
  });

  it("labels an early-decided Back Nine with a correct (non-negative) holes-remaining count", () => {
    // Regression test: the Back Nine's absolute round hole numbers (10-18)
    // differ from its own segment length (9) — p1 wins holes 10-14 outright,
    // deciding the segment at round hole 14 (the segment's 5th hole), which
    // previously produced a nonsensical "5 & -5" by subtracting the segment
    // length from the absolute hole number instead of using the hole
    // result's own segment-relative holesRemaining.
    const grid: Array<[number, number]> = [
      ...Array.from({ length: 9 }, () => [4, 4] as [number, number]), // front nine halved
      [3, 4],
      [3, 4],
      [3, 4],
      [3, 4],
      [3, 4], // back nine: p1 wins holes 10-14 -> 5 up with 4 to play, decided
    ];
    const round = nassauRound(grid);
    const result = calculateMatchPlayRoundResult(round);
    const back = result?.nassauMatches?.find((m) => m.segment === "back");
    expect(back?.winnerSideId).toBe("p1");
    expect(back?.resultLabel).toBe("5 & 4");
  });

  it("is rejected for 9-hole rounds by the setup validator", () => {
    const schema = createMatchPlaySetupSchema(9, ["p1", "p2"]);
    const result = schema.safeParse({
      mode: "individual",
      scoringMode: "gross",
      handicapAllowancePercent: 100,
      stakeCents: 1000,
      tieRule: "halve",
      structure: "nassau",
    });
    expect(result.success).toBe(false);
  });
});
