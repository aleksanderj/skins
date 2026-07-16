import type { CurrencyCode } from "../types";

export const STAKE_PRESETS_CENTS = [100, 200, 500, 1000] as const;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const MIN_HANDICAP = 0;
export const MAX_HANDICAP = 54;

export const CURRENCIES: { code: CurrencyCode; label: string; locale: string }[] = [
  { code: "USD", label: "US Dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "en-IE" },
  { code: "GBP", label: "British Pound (£)", locale: "en-GB" },
  { code: "NOK", label: "Norwegian Krone (kr)", locale: "nb-NO" },
];

export const DEFAULT_PLAYER_COLORS = [colorFor(0), colorFor(1), colorFor(2), colorFor(3)];

function colorFor(index: number) {
  const palette = ["#0D4F35", "#F4B942", "#3B82F6", "#8A4FBE"];
  return palette[index % palette.length];
}
