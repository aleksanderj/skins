import { calculateChallengeBalances } from "../challenges";
import { makePlayers } from "../../test-utils/roundFactory";
import type { Challenge } from "../../types";

describe("calculateChallengeBalances", () => {
  it("returns zero balances for every player when there are no challenges", () => {
    const players = makePlayers(4);
    expect(calculateChallengeBalances([], players)).toEqual({ p1: 0, p2: 0, p3: 0, p4: 0 });
  });

  it("ignores an undecided challenge (no winner yet)", () => {
    const players = makePlayers(2);
    const challenges: Challenge[] = [
      { id: "c1", type: "closest_to_pin", holeNumber: 3, stakeCents: 1000, winnerPlayerId: null },
    ];
    expect(calculateChallengeBalances(challenges, players)).toEqual({ p1: 0, p2: 0 });
  });

  it("pays the winner from every other player for a decided challenge", () => {
    const players = makePlayers(4);
    const challenges: Challenge[] = [
      { id: "c1", type: "longest_drive", holeNumber: 7, stakeCents: 500, winnerPlayerId: "p1" },
    ];
    expect(calculateChallengeBalances(challenges, players)).toEqual({
      p1: 1500,
      p2: -500,
      p3: -500,
      p4: -500,
    });
  });

  it("accumulates balances across multiple challenges with different winners", () => {
    const players = makePlayers(3);
    const challenges: Challenge[] = [
      { id: "c1", type: "closest_to_pin", holeNumber: 2, stakeCents: 1000, winnerPlayerId: "p1" },
      { id: "c2", type: "longest_drive", holeNumber: 5, stakeCents: 500, winnerPlayerId: "p2" },
    ];
    // c1: p1 +2000, p2 -1000, p3 -1000
    // c2: p2 +1000, p1 -500, p3 -500
    expect(calculateChallengeBalances(challenges, players)).toEqual({
      p1: 1500,
      p2: 0,
      p3: -1500,
    });
  });

  it("is zero-sum across all players for any set of decided challenges", () => {
    const players = makePlayers(4);
    const challenges: Challenge[] = [
      { id: "c1", type: "closest_to_pin", holeNumber: 2, stakeCents: 1000, winnerPlayerId: "p3" },
      { id: "c2", type: "longest_drive", holeNumber: 5, stakeCents: 750, winnerPlayerId: "p1" },
    ];
    const balances = calculateChallengeBalances(challenges, players);
    const total = Object.values(balances).reduce((sum, cents) => sum + cents, 0);
    expect(total).toBe(0);
  });

  it("ignores a challenge whose winnerPlayerId isn't in the player list", () => {
    const players = makePlayers(2);
    const challenges: Challenge[] = [
      { id: "c1", type: "closest_to_pin", holeNumber: 1, stakeCents: 1000, winnerPlayerId: "not_a_player" },
    ];
    expect(calculateChallengeBalances(challenges, players)).toEqual({ p1: 0, p2: 0 });
  });
});
