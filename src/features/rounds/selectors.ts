import type { Challenge, PlayerBalance, Round } from "../../types";
import { calculatePlayerBalances } from "../../utils/balances";
import { calculateSettlements } from "../../utils/settlements";
import { calculateChallengeBalances } from "../../utils/challenges";
import { getMatchPlaySides } from "../../utils/matchPlay";

function getBasePlayerBalances(round: Round): PlayerBalance[] {
  if (round.format === "match_play") {
    const balancesCents = round.matchPlayResult?.playerBalancesCents ?? {};
    return round.players.map((p) => ({ playerId: p.id, balanceCents: balancesCents[p.id] ?? 0 }));
  }

  const skinsConfig = round.skinsConfig;
  const skinResults = round.skinsResult?.skinResults ?? [];
  if (!skinsConfig) return round.players.map((p) => ({ playerId: p.id, balanceCents: 0 }));
  return calculatePlayerBalances(round.players, skinResults, skinsConfig.stakePerSkinCents);
}

/** Format balances (Skins or Match Play) plus any decided challenge (side bet) balances layered on top — the single source of truth every screen reads. */
export function getPlayerBalances(round: Round): PlayerBalance[] {
  const base = getBasePlayerBalances(round);
  const challengeBalances = calculateChallengeBalances(getChallenges(round), round.players);
  return base.map((b) => ({ ...b, balanceCents: b.balanceCents + (challengeBalances[b.playerId] ?? 0) }));
}

export function getChallenges(round: Round): Challenge[] {
  return round.challenges ?? [];
}

export function getChallengesForHole(round: Round, holeNumber: number): Challenge[] {
  return getChallenges(round).filter((c) => c.holeNumber === holeNumber);
}

export function getSettlements(round: Round) {
  return calculateSettlements(getPlayerBalances(round));
}

/** Highest balance wins; a shared top balance means the leaderboard is tied. */
export function getLeader(round: Round): { playerId: string; balanceCents: number } | null {
  const balances = getPlayerBalances(round);
  if (balances.length === 0) return null;
  const highest = Math.max(...balances.map((b) => b.balanceCents));
  const leaders = balances.filter((b) => b.balanceCents === highest);
  if (leaders.length !== 1 || highest === 0) return null;
  return { playerId: leaders[0].playerId, balanceCents: leaders[0].balanceCents };
}

export function isHoleComplete(round: Round, holeNumber: number): boolean {
  return round.players.every((p) =>
    round.scores.some(
      (s) => s.playerId === p.id && s.holeNumber === holeNumber && s.grossScore !== null
    )
  );
}

export function getCompletedHoleCount(round: Round): number {
  let count = 0;
  for (let hole = 1; hole <= round.holeCount; hole++) {
    if (isHoleComplete(round, hole)) count++;
    else break;
  }
  return count;
}

/** True once the match/segments are mathematically decided (win, or an accepted halve). */
export function isMatchPlayDecided(round: Round): boolean {
  if (round.format !== "match_play" || !round.matchPlayResult) return false;
  const result = round.matchPlayResult;

  if (result.structure === "nassau") {
    return (result.nassauMatches ?? []).length > 0 && (result.nassauMatches ?? []).every((m) => m.completed);
  }

  const single = result.singleMatch;
  if (!single) return false;
  const tieRule = round.matchPlayConfig?.tieRule;
  return single.winnerSideId !== null || (single.isHalved && tieRule === "halve");
}

/** True once regulation is halved and the configured tie rule is a playoff, but no playoff score exists yet. */
export function isAwaitingPlayoff(round: Round): boolean {
  if (round.format !== "match_play" || round.matchPlayConfig?.structure !== "single_match") return false;
  if (round.matchPlayConfig?.tieRule !== "playoff") return false;
  const single = round.matchPlayResult?.singleMatch;
  if (!single) return false;
  return single.isHalved && single.winnerSideId === null;
}

export function isRoundReadyToComplete(round: Round): boolean {
  if (round.format === "match_play") {
    return isMatchPlayDecided(round);
  }
  return getCompletedHoleCount(round) === round.holeCount;
}

export function getUnresolvedCarryoverCents(round: Round): number {
  if (round.format !== "skins") return 0;
  const results = round.skinsResult?.skinResults ?? [];
  const last = results[results.length - 1];
  if (!last) return 0;
  if (last.holeNumber !== round.holeCount) return 0;
  return last.carriedIntoNextHoleCents;
}

export function getPlayerName(round: Round, playerId: string): string {
  return round.players.find((p) => p.id === playerId)?.name ?? "Unknown player";
}

/** Resolves a Match Play side id to a display name — a player's own name for Individual, a team name for Team. */
export function getMatchPlaySideName(round: Round, sideId: string): string {
  if (round.format !== "match_play" || !round.matchPlayConfig) return "Unknown";
  if (round.matchPlayConfig.mode === "individual") {
    return getPlayerName(round, sideId);
  }
  const team = round.matchPlayConfig.teams?.find((t) => t.id === sideId);
  return team?.name ?? "Unknown team";
}

export function getHoleScore(round: Round, playerId: string, holeNumber: number): number | null {
  const record = round.scores.find((s) => s.playerId === playerId && s.holeNumber === holeNumber);
  return record?.grossScore ?? null;
}

/** Display-friendly winner summary for round cards on Home and History. */
export function getRoundWinnerSummary(
  round: Round
): { name: string; balanceCents: number } | { name: null; balanceCents: 0 } {
  const leader = getLeader(round);
  if (!leader) return { name: null, balanceCents: 0 };
  const name = round.format === "match_play" ? getMatchPlaySideName(round, leader.playerId) : getPlayerName(round, leader.playerId);
  return { name, balanceCents: leader.balanceCents };
}

/** The two competing sides for a Match Play round, or null if config/players are incomplete. */
export function getRoundMatchPlaySides(round: Round) {
  if (round.format !== "match_play" || !round.matchPlayConfig) return null;
  return getMatchPlaySides(round.players, round.matchPlayConfig);
}

/** Short headline used on Home/History cards and the active-match header, e.g. "Alex 2 Up" or "All Square". */
export function getMatchPlayStatusHeadline(round: Round): string {
  if (round.format !== "match_play" || !round.matchPlayResult) return "";
  const sides = getRoundMatchPlaySides(round);
  if (!sides) return "";

  const result = round.matchPlayResult;
  const single = result.structure === "single_match" ? result.singleMatch : undefined;
  if (!single) {
    // Nassau: headline off the Overall segment.
    const overall = result.nassauMatches?.find((m) => m.segment === "overall");
    if (!overall) return "All Square";
    return formatStatusLabel(overall.status, sides.sideA.name, sides.sideB.name);
  }

  const lastHole = single.holeResults[single.holeResults.length - 1];
  if (!lastHole) return "All Square";
  if (single.winnerSideId) {
    return `${getMatchPlaySideName(round, single.winnerSideId)} wins ${single.resultLabel}`;
  }
  if (single.isHalved) return "Match Halved";
  return formatStatusLabel(lastHole.statusAfterHole, sides.sideA.name, sides.sideB.name);
}

function formatStatusLabel(status: number, sideAName: string, sideBName: string): string {
  if (status === 0) return "All Square";
  const leaderName = status > 0 ? sideAName : sideBName;
  return `${leaderName} ${Math.abs(status)} Up`;
}

/** Result summary for a single-match round's Home/History card, e.g. {"Alex defeats Ben", "3 & 2"}. Nassau rounds are summarized separately — see getNassauSummary. */
export function getMatchPlayResultSummary(round: Round): { title: string; subtitle: string } {
  if (round.format !== "match_play" || !round.matchPlayResult) return { title: "", subtitle: "" };

  const single = round.matchPlayResult.singleMatch;
  if (!single) return { title: "", subtitle: "" };
  if (single.isHalved) return { title: "Match Halved", subtitle: "" };
  if (!single.winnerSideId) return { title: "In progress", subtitle: "" };

  const winnerName = getMatchPlaySideName(round, single.winnerSideId);
  const loserId = single.winnerSideId === single.sideAId ? single.sideBId : single.sideAId;
  const loserName = getMatchPlaySideName(round, loserId);
  return { title: `${winnerName} defeats ${loserName}`, subtitle: single.resultLabel };
}

/** Nassau-only result breakdown for Home/History cards — null for non-Nassau rounds. Kept separate from getMatchPlayResultSummary because the card renders "leader" and "N of M matches" as two distinct lines rather than one combined subtitle. */
export function getNassauSummary(
  round: Round
): { leaderName: string | null; decidedCount: number; totalCount: number } | null {
  if (round.format !== "match_play" || round.matchPlayConfig?.structure !== "nassau" || !round.matchPlayResult) {
    return null;
  }
  const sides = getRoundMatchPlaySides(round);
  if (!sides) return null;

  const matches = round.matchPlayResult.nassauMatches ?? [];
  const sideAWins = matches.filter((m) => m.winnerSideId === sides.sideA.id).length;
  const sideBWins = matches.filter((m) => m.winnerSideId === sides.sideB.id).length;
  const decidedCount = matches.filter((m) => m.completed).length;
  const leaderName = sideAWins > sideBWins ? sides.sideA.name : sideBWins > sideAWins ? sides.sideB.name : null;

  return { leaderName, decidedCount, totalCount: matches.length };
}
