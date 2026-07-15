import type { Hole } from "../types";

const NINE_HOLE_PARS: Array<3 | 4 | 5> = [4, 4, 3, 5, 4, 4, 3, 5, 4];

/**
 * Generates a plausible default scorecard. There is no course database in
 * the MVP — this is a reasonable starting point that users can edit in the
 * Course Setup section before starting the round.
 */
export function generateDefaultHoles(holeCount: 9 | 18): Hole[] {
  const pars = holeCount === 9 ? NINE_HOLE_PARS : [...NINE_HOLE_PARS, ...NINE_HOLE_PARS];

  return pars.map((par, index) => {
    const number = index + 1;
    return {
      number,
      par,
      strokeIndex: defaultStrokeIndex(number, holeCount),
    };
  });
}

/**
 * Front nine gets the odd stroke indexes, back nine gets the even ones —
 * a common real-course convention that keeps difficulty spread evenly
 * rather than clustering all the hard holes on one side.
 */
function defaultStrokeIndex(holeNumber: number, holeCount: 9 | 18): number {
  if (holeCount === 9) {
    return holeNumber;
  }
  const isFrontNine = holeNumber <= 9;
  const positionInNine = isFrontNine ? holeNumber : holeNumber - 9;
  return isFrontNine ? positionInNine * 2 - 1 : positionInNine * 2;
}
