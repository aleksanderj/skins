export type ScoreToParCategory =
  | "albatross-or-better"
  | "eagle"
  | "birdie"
  | "par"
  | "bogey"
  | "double-bogey"
  | "triple-or-worse";

/** Golf scoring convention: category is always relative to gross score vs. par, regardless of net/gross display mode. */
export function getScoreToParCategory(score: number, par: number): ScoreToParCategory {
  const diff = score - par;
  if (diff <= -3) return "albatross-or-better";
  if (diff === -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double-bogey";
  return "triple-or-worse";
}
