import { calculateSettlements } from "../settlements";
import type { PlayerBalance } from "../../types";

function balance(playerId: string, balanceCents: number): PlayerBalance {
  return { playerId, balanceCents, skinsWon: 0 };
}

describe("calculateSettlements", () => {
  it("settles a single debtor and single creditor", () => {
    const settlements = calculateSettlements([balance("a", 500), balance("b", -500)]);
    expect(settlements).toEqual([{ fromPlayerId: "b", toPlayerId: "a", amountCents: 500 }]);
  });

  it("settles multiple debtors against one creditor", () => {
    const settlements = calculateSettlements([
      balance("a", 1000),
      balance("b", -600),
      balance("c", -400),
    ]);
    expect(settlements).toHaveLength(2);
    const total = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    expect(total).toBe(1000);
  });

  it("settles multiple creditors against one debtor", () => {
    const settlements = calculateSettlements([
      balance("a", 600),
      balance("b", 400),
      balance("c", -1000),
    ]);
    expect(settlements).toHaveLength(2);
    const total = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    expect(total).toBe(1000);
  });

  it("matches the example scenario with a near-minimal payment set", () => {
    // Alex +25, Ben +5, Chris -10, Dana -20
    const settlements = calculateSettlements([
      balance("alex", 2500),
      balance("ben", 500),
      balance("chris", -1000),
      balance("dana", -2000),
    ]);
    expect(settlements).toEqual([
      { fromPlayerId: "dana", toPlayerId: "alex", amountCents: 2000 },
      { fromPlayerId: "chris", toPlayerId: "alex", amountCents: 500 },
      { fromPlayerId: "chris", toPlayerId: "ben", amountCents: 500 },
    ]);
  });

  it("handles decimal currency represented in cents", () => {
    const settlements = calculateSettlements([balance("a", 333), balance("b", -333)]);
    expect(settlements[0].amountCents).toBe(333);
  });

  it("ignores zero balances", () => {
    const settlements = calculateSettlements([
      balance("a", 500),
      balance("b", -500),
      balance("c", 0),
    ]);
    expect(settlements.every((s) => s.fromPlayerId !== "c" && s.toPlayerId !== "c")).toBe(true);
  });

  it("returns no settlements when all balances are zero", () => {
    const settlements = calculateSettlements([balance("a", 0), balance("b", 0)]);
    expect(settlements).toEqual([]);
  });

  it("always pays out exactly what is owed in total", () => {
    const balances = [balance("a", 1200), balance("b", 300), balance("c", -700), balance("d", -800)];
    const settlements = calculateSettlements(balances);
    const totalOut = settlements.reduce((sum, s) => sum + s.amountCents, 0);
    const totalOwed = balances.filter((b) => b.balanceCents < 0).reduce((sum, b) => sum - b.balanceCents, 0);
    const totalDue = balances.filter((b) => b.balanceCents > 0).reduce((sum, b) => sum + b.balanceCents, 0);
    expect(totalOut).toBe(totalOwed);
    expect(totalOut).toBe(totalDue);
  });
});
