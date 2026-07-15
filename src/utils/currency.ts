import { CURRENCIES } from "../constants/golf";
import type { CurrencyCode } from "../types";

export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatCurrency(cents: number, currency: CurrencyCode = "USD"): string {
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const formatter = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(centsToDollars(cents));
}

/** Formats a balance with an explicit leading sign, e.g. "+$45.00" / "-$15.00". */
export function formatSignedCurrency(cents: number, currency: CurrencyCode = "USD"): string {
  const formatted = formatCurrency(Math.abs(cents), currency);
  if (cents > 0) return `+${formatted}`;
  if (cents < 0) return `-${formatted}`;
  return formatted;
}
