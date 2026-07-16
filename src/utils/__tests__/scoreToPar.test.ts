import { getScoreToParCategory } from "../scoreToPar";

describe("getScoreToParCategory", () => {
  it("returns par when score equals par", () => {
    expect(getScoreToParCategory(4, 4)).toBe("par");
  });

  it("returns birdie for one under par", () => {
    expect(getScoreToParCategory(3, 4)).toBe("birdie");
  });

  it("returns eagle for two under par", () => {
    expect(getScoreToParCategory(2, 4)).toBe("eagle");
  });

  it("returns albatross-or-better for three or more under par", () => {
    expect(getScoreToParCategory(1, 4)).toBe("albatross-or-better");
    expect(getScoreToParCategory(2, 5)).toBe("albatross-or-better");
  });

  it("returns bogey for one over par", () => {
    expect(getScoreToParCategory(5, 4)).toBe("bogey");
  });

  it("returns double-bogey for two over par", () => {
    expect(getScoreToParCategory(6, 4)).toBe("double-bogey");
  });

  it("returns triple-or-worse for three or more over par", () => {
    expect(getScoreToParCategory(7, 4)).toBe("triple-or-worse");
    expect(getScoreToParCategory(10, 4)).toBe("triple-or-worse");
  });
});
