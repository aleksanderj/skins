import { generateDefaultHoles } from "../../utils/course";
import type { CreateRoundInput } from "./types";

/** Dev-only seed data so the primary flow can be exercised without manual setup. */
export function buildDemoRoundInput(): CreateRoundInput {
  return {
    name: "Skins at Green Hills Golf Club",
    courseName: "Green Hills Golf Club",
    holeCount: 9,
    scoringMode: "net",
    stakePerSkinCents: 500,
    carryoversEnabled: true,
    currency: "USD",
    holes: generateDefaultHoles(9),
    players: [
      { name: "Alex", handicap: 8 },
      { name: "Ben", handicap: 14 },
      { name: "Chris", handicap: 20 },
      { name: "Dana", handicap: 5 },
    ],
  };
}
