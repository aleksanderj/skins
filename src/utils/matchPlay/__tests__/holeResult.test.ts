import {
  calculateIndividualMatchPlayHole,
  calculateMatchStatus,
  calculateTeamMatchPlayHole,
  isDormie,
  isMatchComplete,
} from "../holeResult";

describe("calculateIndividualMatchPlayHole", () => {
  it("declares the lower score the winner", () => {
    expect(calculateIndividualMatchPlayHole(3, 4)).toBe("A");
    expect(calculateIndividualMatchPlayHole(5, 4)).toBe("B");
  });

  it("halves the hole on equal scores", () => {
    expect(calculateIndividualMatchPlayHole(4, 4)).toBeNull();
  });
});

describe("calculateTeamMatchPlayHole", () => {
  it("uses the lowest score on each team", () => {
    expect(calculateTeamMatchPlayHole([5, 3], [4, 6])).toBe("A"); // A's best (3) beats B's best (4)
  });

  it("lets a different team member win depending on who scores best", () => {
    expect(calculateTeamMatchPlayHole([6, 3], [4, 5])).toBe("A");
    expect(calculateTeamMatchPlayHole([6, 5], [4, 7])).toBe("B");
  });

  it("halves the hole when both teams' best scores match", () => {
    expect(calculateTeamMatchPlayHole([5, 4], [6, 4])).toBeNull();
  });
});

describe("calculateMatchStatus", () => {
  it("moves from All Square to 1 Up when side A wins a hole", () => {
    expect(calculateMatchStatus(0, "A")).toBe(1);
  });

  it("returns to All Square when the trailing side wins back a hole", () => {
    expect(calculateMatchStatus(1, "B")).toBe(0);
  });

  it("leaves status unchanged on a halved hole", () => {
    expect(calculateMatchStatus(2, null)).toBe(2);
  });
});

describe("isDormie", () => {
  it("is true when the lead exactly equals the holes remaining", () => {
    expect(isDormie(2, 2, false)).toBe(true);
  });

  it("is false once the match is already complete", () => {
    expect(isDormie(2, 2, true)).toBe(false);
  });

  it("is false when the lead is less than holes remaining", () => {
    expect(isDormie(1, 2, false)).toBe(false);
  });

  it("is false with no holes remaining", () => {
    expect(isDormie(1, 0, false)).toBe(false);
  });
});

describe("isMatchComplete", () => {
  it("is true once the lead exceeds the holes remaining", () => {
    expect(isMatchComplete(3, 2)).toBe(true);
  });

  it("is false when the lead only equals the holes remaining (dormie, not complete)", () => {
    expect(isMatchComplete(2, 2)).toBe(false);
  });

  it("is true on the final hole whenever the match isn't tied", () => {
    expect(isMatchComplete(1, 0)).toBe(true);
    expect(isMatchComplete(0, 0)).toBe(false);
  });
});
