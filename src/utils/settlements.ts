import type { PlayerBalance, Settlement } from "../types";

/**
 * Greedy debt-simplification: repeatedly match the largest debtor with the
 * largest creditor until every balance is cleared. Not guaranteed to be the
 * mathematically minimal number of transactions in every case, but it is a
 * simple, deterministic near-minimal result that's easy for players to
 * follow and verify.
 */
export function calculateSettlements(balances: PlayerBalance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({ playerId: b.playerId, remainingCents: -b.balanceCents }))
    .sort((a, b) => b.remainingCents - a.remainingCents);

  const creditors = balances
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({ playerId: b.playerId, remainingCents: b.balanceCents }))
    .sort((a, b) => b.remainingCents - a.remainingCents);

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.remainingCents, creditor.remainingCents);

    if (amountCents > 0) {
      settlements.push({
        fromPlayerId: debtor.playerId,
        toPlayerId: creditor.playerId,
        amountCents,
      });
    }

    debtor.remainingCents -= amountCents;
    creditor.remainingCents -= amountCents;

    if (debtor.remainingCents === 0) debtorIndex++;
    if (creditor.remainingCents === 0) creditorIndex++;
  }

  return settlements;
}
