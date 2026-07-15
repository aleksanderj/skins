import type { PlayerBalance, Round, Settlement } from "../../types";
import { formatCurrency, formatSignedCurrency } from "../../utils/currency";
import { getPlayerName } from "../rounds/selectors";

export function buildShareText(round: Round, balances: PlayerBalance[], settlements: Settlement[]): string {
  const lines: string[] = [];
  lines.push(round.name);
  lines.push("");

  for (const balance of balances) {
    lines.push(`${getPlayerName(round, balance.playerId)}: ${formatSignedCurrency(balance.balanceCents, round.currency)}`);
  }

  lines.push("");
  lines.push("Settlement:");
  if (settlements.length === 0) {
    lines.push("Everyone's square — no payments needed.");
  } else {
    for (const settlement of settlements) {
      lines.push(
        `${getPlayerName(round, settlement.fromPlayerId)} pays ${getPlayerName(round, settlement.toPlayerId)} ${formatCurrency(settlement.amountCents, round.currency)}`
      );
    }
  }

  lines.push("");
  lines.push("Payments handled outside the app.");

  return lines.join("\n");
}
