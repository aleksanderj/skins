import type { MatchPlayMatchResult, MatchPlaySide, NassauMatchResult } from "../../types";

/**
 * Splits a stake between two sides once a match is decided. A halved match
 * (or one still in progress) transfers nothing. The stake is interpreted as
 * the *total* transferred between sides, then divided evenly across each
 * side's member count — which collapses to "winner gets it all" for
 * Individual Match Play (1 member per side) and an even split for Team
 * Match Play (2 members per side), matching the product spec's examples.
 */
export function calculateMatchPlayBalances(
  sideA: MatchPlaySide,
  sideB: MatchPlaySide,
  matchResult: MatchPlayMatchResult,
  stakeCents: number
): Record<string, number> {
  const balances: Record<string, number> = {};
  [...sideA.playerIds, ...sideB.playerIds].forEach((id) => {
    balances[id] = 0;
  });

  if (matchResult.isHalved || !matchResult.winnerSideId) {
    return balances;
  }

  const winningSide = matchResult.winnerSideId === sideA.id ? sideA : sideB;
  const losingSide = matchResult.winnerSideId === sideA.id ? sideB : sideA;

  const perWinnerCents = Math.round(stakeCents / winningSide.playerIds.length);
  const perLoserCents = Math.round(stakeCents / losingSide.playerIds.length);

  winningSide.playerIds.forEach((id) => {
    balances[id] = (balances[id] ?? 0) + perWinnerCents;
  });
  losingSide.playerIds.forEach((id) => {
    balances[id] = (balances[id] ?? 0) - perLoserCents;
  });

  return balances;
}

/**
 * Sums three independent Nassau bets (Front Nine, Back Nine, Overall) into
 * one net balance per player. Segments that are halved or not yet decided
 * contribute nothing — only mathematically confirmed results transfer money.
 */
export function calculateNassauBalances(
  sideA: MatchPlaySide,
  sideB: MatchPlaySide,
  nassauMatches: NassauMatchResult[],
  stakeCentsPerMatch: number
): Record<string, number> {
  const totals: Record<string, number> = {};
  [...sideA.playerIds, ...sideB.playerIds].forEach((id) => {
    totals[id] = 0;
  });

  for (const match of nassauMatches) {
    if (!match.completed || match.winnerSideId === null) continue;

    const winningSide = match.winnerSideId === sideA.id ? sideA : sideB;
    const losingSide = match.winnerSideId === sideA.id ? sideB : sideA;
    const perWinnerCents = Math.round(stakeCentsPerMatch / winningSide.playerIds.length);
    const perLoserCents = Math.round(stakeCentsPerMatch / losingSide.playerIds.length);

    winningSide.playerIds.forEach((id) => {
      totals[id] = (totals[id] ?? 0) + perWinnerCents;
    });
    losingSide.playerIds.forEach((id) => {
      totals[id] = (totals[id] ?? 0) - perLoserCents;
    });
  }

  return totals;
}
