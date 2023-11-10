import "dotenv/config";
import express from "express";
import { GEMINI_PUBLIC_WS_BASE_URL, PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";
import MarketDataWebSocket from "./web-sockets/market-data-socket";

async function main() {
  const app = express();

  app.use(express.json());
  app.use(router);

  const marketDataSocket = new MarketDataWebSocket(
    `${GEMINI_PUBLIC_WS_BASE_URL}/v2/marketdata/BTCUSD`
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
  });
}

main();
