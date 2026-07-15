import type { Round, SkinResult } from "../types";
import { calculateNetScore, calculatePlayingHandicap, getHandicapStrokesForHole } from "./handicap";

export type HoleScoreEntry = { playerId: string; score: number };

export type HoleWinnerResult = {
  winnerPlayerId: string | null;
  tiedPlayerIds: string[];
};

/** Lowest score on the hole wins. Two or more players tied for lowest ties the hole. */
export function calculateHoleWinner(entries: HoleScoreEntry[]): HoleWinnerResult {
  if (entries.length === 0) {
    return { winnerPlayerId: null, tiedPlayerIds: [] };
  }
  const lowest = Math.min(...entries.map((e) => e.score));
  const lowestPlayers = entries.filter((e) => e.score === lowest).map((e) => e.playerId);

  if (lowestPlayers.length === 1) {
    return { winnerPlayerId: lowestPlayers[0], tiedPlayerIds: [] };
  }
  return { winnerPlayerId: null, tiedPlayerIds: lowestPlayers };
}

/**
 * Computes each player's effective (gross or net) score for a hole.
 * Returns null if any player is missing a gross score for this hole.
 */
export function computeHoleScores(round: Round, holeNumber: number): HoleScoreEntry[] | null {
  const hole = round.holes.find((h) => h.number === holeNumber);
  if (!hole) return null;

  const entries: HoleScoreEntry[] = [];
  for (const player of round.players) {
    const scoreRecord = round.scores.find(
      (s) => s.playerId === player.id && s.holeNumber === holeNumber
    );
    if (!scoreRecord || scoreRecord.grossScore === null) {
      return null;
    }

    if (round.scoringMode === "gross") {
      entries.push({ playerId: player.id, score: scoreRecord.grossScore });
    } else {
      const playingHandicap = calculatePlayingHandicap(player.handicap, round.holeCount);
      const strokes = getHandicapStrokesForHole(playingHandicap, hole.strokeIndex, round.holeCount);
      const net = calculateNetScore(scoreRecord.grossScore, strokes);
      entries.push({ playerId: player.id, score: net as number });
    }
  }
  return entries;
}

/**
 * Walks the round's holes in order, computing a SkinResult for every hole
 * that has a complete set of scores. Stops at the first hole with an
 * incomplete score, since later holes can't be resolved without it.
 * Carryovers accumulate skins across consecutive tied holes; the final
 * hole's carry (if tied) is left unresolved and surfaced on that result.
 */
export function calculateSkinResults(round: Round): SkinResult[] {
  const results: SkinResult[] = [];
  let carriedSkins = 0;

  const sortedHoles = [...round.holes].sort((a, b) => a.number - b.number).slice(0, round.holeCount);

  for (const hole of sortedHoles) {
    const scores = computeHoleScores(round, hole.number);
    if (!scores) break;

    const { winnerPlayerId, tiedPlayerIds } = calculateHoleWinner(scores);
    const skinsAtStake = 1 + carriedSkins;

    if (winnerPlayerId) {
      results.push({
        holeNumber: hole.number,
        winnerPlayerId,
        tiedPlayerIds: [],
        skinsWon: skinsAtStake,
        monetaryValueCents: skinsAtStake * round.stakePerSkinCents,
        carriedIntoNextHoleCents: 0,
      });
      carriedSkins = 0;
    } else if (round.carryoversEnabled) {
      carriedSkins = skinsAtStake;
      results.push({
        holeNumber: hole.number,
        winnerPlayerId: null,
        tiedPlayerIds,
        skinsWon: 0,
        monetaryValueCents: 0,
        carriedIntoNextHoleCents: carriedSkins * round.stakePerSkinCents,
      });
    } else {
      results.push({
        holeNumber: hole.number,
        winnerPlayerId: null,
        tiedPlayerIds,
        skinsWon: 0,
        monetaryValueCents: 0,
        carriedIntoNextHoleCents: 0,
      });
      carriedSkins = 0;
    }
  }

  return results;
}
