import { calculatePlayerBalances } from "../balances";
import type { SkinResult } from "../../types";
import { makePlayers } from "../../test-utils/roundFactory";

function skin(holeNumber: number, winnerPlayerId: string | null, skinsWon: number): SkinResult {
  return {
    holeNumber,
    winnerPlayerId,
    tiedPlayerIds: winnerPlayerId ? [] : ["p1", "p2"],
    skinsWon,
    monetaryValueCents: skinsWon * 500,
    carriedIntoNextHoleCents: 0,
  };
}

describe("calculatePlayerBalances", () => {
  it("computes a two-player round: winner gains what the loser loses", () => {
    const players = makePlayers(2);
    const balances = calculatePlayerBalances(players, [skin(1, "p1", 1)], 500);
    expect(balances.find((b) => b.playerId === "p1")?.balanceCents).toBe(500);
    expect(balances.find((b) => b.playerId === "p2")?.balanceCents).toBe(-500);
  });

  it("computes a three-player round with a single skin winner", () => {
    const players = makePlayers(3);
    const balances = calculatePlayerBalances(players, [skin(1, "p1", 1)], 500);
    expect(balances.find((b) => b.playerId === "p1")?.balanceCents).toBe(1000);
    expect(balances.find((b) => b.playerId === "p2")?.balanceCents).toBe(-500);
    expect(balances.find((b) => b.playerId === "p3")?.balanceCents).toBe(-500);
  });

  it("computes a four-player round: one skin worth $5 nets the winner $15", () => {
    const players = makePlayers(4);
    const balances = calculatePlayerBalances(players, [skin(1, "p1", 1)], 500);
    expect(balances.find((b) => b.playerId === "p1")?.balanceCents).toBe(1500);
    for (const loserId of ["p2", "p3", "p4"]) {
      expect(balances.find((b) => b.playerId === loserId)?.balanceCents).toBe(-500);
    }
  });

  it("always sums to zero across all players", () => {
    const players = makePlayers(4);
    const skinResults = [skin(1, "p1", 1), skin(2, "p2", 2), skin(3, null, 0), skin(4, "p3", 1)];
    const balances = calculatePlayerBalances(players, skinResults, 500);
    const total = balances.reduce((sum, b) => sum + b.balanceCents, 0);
    expect(total).toBe(0);
  });

  it("gives one player every skin when they win every hole", () => {
    const players = makePlayers(3);
    const skinResults = [skin(1, "p1", 1), skin(2, "p1", 1), skin(3, "p1", 1)];
    const balances = calculatePlayerBalances(players, skinResults, 500);
    expect(balances.find((b) => b.playerId === "p1")?.skinsWon).toBe(3);
    expect(balances.find((b) => b.playerId === "p1")?.balanceCents).toBe(3000);
    expect(balances.find((b) => b.playerId === "p2")?.balanceCents).toBe(-1500);
    expect(balances.find((b) => b.playerId === "p3")?.balanceCents).toBe(-1500);
  });
});
