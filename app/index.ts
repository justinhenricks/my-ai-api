import "dotenv/config";
import express from "express";
import { IS_PROD, PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";
import { MarketWatcher } from "./trading/market-watcher";
import { OrderWatcher } from "./trading/order-watcher";
async function main() {
  const app = express();

  app.use(express.json());
  app.use(router);

  //Init Crpyto Bot
  const marketWatcher = new MarketWatcher("solusd");
  const orderWatcher = new OrderWatcher();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server is running on port: ${PORT} and in ${
        IS_PROD ? "production" : "development."
      }`
    );
  });
}

main();
