import { centsToDollars, dollarsToCents, formatCurrency, formatSignedCurrency } from "../currency";

describe("currency conversion", () => {
  it("converts dollars to cents without floating point drift", () => {
    expect(dollarsToCents(5)).toBe(500);
    expect(dollarsToCents(1.1)).toBe(110);
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it("converts cents back to dollars", () => {
    expect(centsToDollars(500)).toBe(5);
    expect(centsToDollars(110)).toBeCloseTo(1.1);
  });
});

describe("formatCurrency", () => {
  it("formats USD with two decimal places", () => {
    expect(formatCurrency(1500, "USD")).toBe("$15.00");
  });

  it("formats decimal cent values correctly", () => {
    expect(formatCurrency(333, "USD")).toBe("$3.33");
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes positive balances with a plus sign", () => {
    expect(formatSignedCurrency(2500, "USD")).toBe("+$25.00");
  });

  it("prefixes negative balances with a minus sign", () => {
    expect(formatSignedCurrency(-2000, "USD")).toBe("-$20.00");
  });

  it("shows zero with no sign", () => {
    expect(formatSignedCurrency(0, "USD")).toBe("$0.00");
  });
});
