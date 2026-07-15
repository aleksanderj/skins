import type { PlayerBalance, Round, Settlement } from "../../types";
import { formatCurrency, formatSignedCurrency } from "../../utils/currency";
import { getMatchPlaySideName, getPlayerName } from "../rounds/selectors";

export function buildShareText(round: Round, balances: PlayerBalance[], settlements: Settlement[]): string {
  const lines: string[] = [];
  lines.push(round.name);
  lines.push("");

  if (round.format === "match_play" && round.matchPlayResult) {
    const result = round.matchPlayResult;
    if (result.structure === "nassau") {
      for (const match of result.nassauMatches ?? []) {
        const title = match.segment === "front" ? "Front Nine" : match.segment === "back" ? "Back Nine" : "Overall";
        const label = match.resultLabel ?? "In progress";
        const winner = match.winnerSideId ? `${getMatchPlaySideName(round, match.winnerSideId)} wins ` : "";
        lines.push(`${title}: ${winner}${label}`);
      }
    } else if (result.singleMatch) {
      const winner = result.singleMatch.winnerSideId ? getMatchPlaySideName(round, result.singleMatch.winnerSideId) : null;
      lines.push(winner ? `${winner} wins ${result.singleMatch.resultLabel}` : result.singleMatch.resultLabel);
    }
    lines.push("");
  }

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
