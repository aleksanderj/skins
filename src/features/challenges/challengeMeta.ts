import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { ChallengeType } from "../../types";

type IconName = ComponentProps<typeof Ionicons>["name"];

const LABELS: Record<ChallengeType, string> = {
  closest_to_pin: "Closest to the Pin",
  longest_drive: "Longest Drive",
};

const ICONS: Record<ChallengeType, IconName> = {
  closest_to_pin: "locate",
  longest_drive: "rocket",
};

export function getChallengeTypeLabel(type: ChallengeType): string {
  return LABELS[type];
}

export function getChallengeTypeIcon(type: ChallengeType): IconName {
  return ICONS[type];
}
