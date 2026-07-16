import React from "react";
import { SettlementSummaryCard } from "../../components/SettlementSummaryCard";

const PREVIEW_ENTRIES = [
  { fromName: "Blake", toName: "You", amountCents: 4500 },
  { fromName: "Sam", toName: "You", amountCents: 4500 },
  { fromName: "Sam", toName: "Blake", amountCents: 4500 },
];

/** Static "Settle Up Easily" mockup for onboarding — illustrative only, reuses the real settlement summary design. */
export function SettlementPreviewCard() {
  return <SettlementSummaryCard totalPotCents={13500} entries={PREVIEW_ENTRIES} currency="USD" />;
}
