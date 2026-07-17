import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { EmptyState } from "../../components/EmptyState";
import { getChallenges } from "../rounds/selectors";
import { ChallengeCard } from "./ChallengeCard";
import type { Round } from "../../types";

type Props = {
  round: Round;
};

/**
 * Read-only-except-resolution: challenges are added at round creation (see
 * ChallengesSetupSection), not mid-round. This just lists what was set up and
 * lets the group mark a winner once the hole's been played, or remove one
 * that was set up in error.
 */
export function ChallengesSection({ round }: Props) {
  const removeChallenge = useAppStore((s) => s.removeChallenge);
  const setChallengeWinner = useAppStore((s) => s.setChallengeWinner);
  const challenges = getChallenges(round);

  if (challenges.length === 0) {
    return (
      <EmptyState
        icon="golf-outline"
        title="No challenges set up"
        message="Closest-to-the-pin and longest-drive side bets are set up when starting a round."
      />
    );
  }

  return (
    <>
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          round={round}
          challenge={challenge}
          onSetWinner={(playerId) => setChallengeWinner(challenge.id, playerId)}
          onRemove={() => removeChallenge(challenge.id)}
        />
      ))}
    </>
  );
}
