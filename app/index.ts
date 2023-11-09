import "dotenv/config";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import { GEMINI_PUBLIC_WS_BASE_URL, PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";
import { GeminiApiClient } from "./services/gemini";

async function main() {
  const app = express();

  app.use(express.json());
  app.use(router);

  // Create a WebSocket client instance
  const ws = new WebSocket(`${GEMINI_PUBLIC_WS_BASE_URL}/v2/marketdata/BTCUSD`);

  ws.on("open", function open() {
    console.log("Connected to the WebSocket server!");

    // Subscription message
    const subscribeMessage = {
      type: "subscribe",
      subscriptions: [{ name: "candles_1m", symbols: ["BTCUSD"] }],
    };

    // Send the message to subscribe
    ws.send(JSON.stringify(subscribeMessage));
  });

  // Configuration for short-term and long-term EMA periods
  const shortTermPeriod = 2; // e.g., 120 minutes for 2-hour EMA
  const longTermPeriod = 6; // e.g., 360 minutes for 6-hour EMA

  // State to keep track of previous EMA values
  let prevShortTermEma: undefined | number = undefined;
  let prevLongTermEma: undefined | number = undefined;

  // Price history - we only need to keep 'longTermPeriod' number of latest prices
  let priceHistory: number[] = [];

  function onNewPrice(newPrice: number) {
    // Add the new price to the history
    console.log("ok in new price, here is price history", priceHistory);
    priceHistory.push(newPrice);

    // Ensure we don't keep more prices than necessary
    if (priceHistory.length > longTermPeriod) {
      priceHistory.shift(); // Remove the oldest price
    }

    // Calculate the short-term EMA if we have enough data points
    if (priceHistory.length >= shortTermPeriod) {
      let newShortTermEma = calculateEMA(
        priceHistory.slice(-shortTermPeriod),
        shortTermPeriod,
        prevShortTermEma
      );
      if (newShortTermEma !== undefined) {
        prevShortTermEma = newShortTermEma;
        console.log(`New short-term EMA is: ${newShortTermEma}`);
      }
    }

    // Calculate the long-term EMA if we have enough data points
    if (priceHistory.length >= longTermPeriod) {
      let newLongTermEma = calculateEMA(
        priceHistory,
        longTermPeriod,
        prevLongTermEma
      );
      if (newLongTermEma !== undefined) {
        prevLongTermEma = newLongTermEma;
        console.log(`New long-term EMA is: ${newLongTermEma}`);
      }
    }

    // Check if we should make a trade (EMA crossover logic)
    if (prevShortTermEma !== undefined && prevLongTermEma !== undefined) {
      // This is where you'd check for a crossover and decide whether to trade
      if (prevShortTermEma > prevLongTermEma) {
        // Signal for bullish crossover, potentially a buy signal
      } else if (prevShortTermEma < prevLongTermEma) {
        // Signal for bearish crossover, potentially a sell signal
      }
    }
  }

  function calculateSMA(prices: number[], period: number) {
    let sum = prices.slice(-period).reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  function calculateEMA(
    prices: number[],
    period: number,
    prevEma: number | undefined
  ) {
    // The smoothing constant
    const k = 2 / (period + 1);

    // If we don't have a previous EMA, calculate the SMA for the first EMA value
    // This assumes we have at least `period` number of prices
    if (prevEma === undefined && prices.length >= period) {
      prevEma = calculateSMA(prices, period);
    }

    // If we still don't have a previous EMA (due to not enough data), return undefined
    if (prevEma === undefined) {
      return undefined;
    }

    // The latest price is the most recent price in our prices array
    const latestPrice = prices[prices.length - 1];

    // Calculate the EMA based on the previous EMA and the latest price
    let newEma = (latestPrice - prevEma) * k + prevEma;

    return newEma;
  }

  ws.on("message", function incoming(data) {
    // Parse the incoming data
    const message = JSON.parse(data);

    if (message.type === "candles_1m_updates") {
      const candle = message.changes[0];
      const [, , , , close] = candle;

      onNewPrice(close);
    }
  });

  // Usage
  const apiKey: string = process.env.GEMINI_API_KEY!;
  const apiSecret: string = process.env.GEMINI_API_SECRET!;
  const client = new GeminiApiClient(apiKey, apiSecret);

  const orderId = uuidv4();
  client
    .newOrder({
      symbol: "btcusd",
      client_order_id: orderId,
      type: "exchange limit",
      side: "buy",
      options: ["maker-or-cancel"],
      amount: ".001",
      price: "1",
    })
    .then(console.log)
    .catch(console.error);

  client.getBalances().then(console.log).catch(console.error);

  client.getTicker("btcusd").then(console.log).catch(console.error);

  ws.on("close", function close() {
    console.log("Disconnected from the WebSocket server");
  });

  ws.on("error", function error(error) {
    console.error("WebSocket error: ", error);
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
  });
}

main();
