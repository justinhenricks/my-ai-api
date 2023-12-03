import { db } from "../db";
import { GeminiApiClient } from "../services/gemini";

export async function doGeminiPortfolioSummary() {
  console.log("Going to do gemini portfolio summary ✅");

  const openTrades = await db.trade.count({
    where: {
      status: "open",
    },
  });

  const client = new GeminiApiClient(
    process.env.GEMINI_API_KEY!,
    process.env.GEMINI_API_SECRET!
  );

  const balances = await client.getBalances();

  const cashBalanceString = balances.find(
    (b) => b.currency === "USD"
  )?.available;

  const cashBalanceFloat = cashBalanceString
    ? parseFloat(parseFloat(cashBalanceString).toFixed(2))
    : 0;

  const summary = await db.geminiPortfolioSummary.create({
    data: {
      cash_balance: cashBalanceFloat,
      open_trades: openTrades,
    },
  });
}
