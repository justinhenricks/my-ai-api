import "dotenv/config";
import express from "express";
import { WebSocket } from "ws";
import { GEMINI_PUBLIC_WS_BASE_URL, PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";

async function main() {
  const app = express();

  app.use(express.json());
  app.use(router);

  // Create a WebSocket client instance
  const ws = new WebSocket(`${GEMINI_PUBLIC_WS_BASE_URL}/v2/marketdata/BTCUSD`);

  let lastClose = 0;

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

  const periodShort = 5; // Short EMA period
  const periodLong = 10; // Long EMA period
  let prices = []; // Stores the recent prices
  let EMA_short = 0;
  let EMA_long = 0;
  let initialized = false; // This will be true once we have enough data to calculate the SMA

  // Function to calculate SMA
  function calculateSMA(prices, period) {
    const sum = prices.reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  // Function to calculate EMA
  function calculateEMA(
    previousEMA,
    price,
    multiplier,
    period,
    isFirstCalculation = false
  ) {
    if (isFirstCalculation) {
      // If this is the first calculation, use the SMA as the previous EMA
      return calculateSMA(prices.slice(-period), period);
    } else {
      return (price - previousEMA) * multiplier + previousEMA;
    }
  }

  ws.on("message", function incoming(data) {
    // Parse the incoming data
    const message = JSON.parse(data);
    console.log("here is message", message);
    if (message.type === "candles_1m_updates") {
      const candle = message.changes[0];
      const [, , , , close] = candle;
      prices.push(close); // Store the closing price for EMA calculation

      console.log("ok here are prices", prices);

      // Ensure we have enough data to calculate the initial SMA
      if (!initialized && prices.length >= periodLong) {
        initialized = true;
        // Calculate initial EMA values using SMA
        EMA_short = calculateEMA(
          EMA_short,
          close,
          2 / (periodShort + 1),
          periodShort,
          true
        );
        EMA_long = calculateEMA(
          EMA_long,
          close,
          2 / (periodLong + 1),
          periodLong,
          true
        );
      } else if (initialized) {
        // Update EMAs with the latest closing price
        EMA_short = calculateEMA(
          EMA_short,
          close,
          2 / (periodShort + 1),
          periodShort
        );
        EMA_long = calculateEMA(
          EMA_long,
          close,
          2 / (periodLong + 1),
          periodLong
        );
      }

      // Print the EMAs to the console
      if (initialized) {
        console.log(`Short EMA: ${EMA_short}`);
        console.log(`Long EMA: ${EMA_long}`);
      }

      // Check if we can issue a buy/sell signal based on the EMAs
      if (initialized && EMA_short > EMA_long) {
        // Signal a potential buy
        const buyPrice = close;
        console.log(`Buy signal at: ${buyPrice}`);
        // Simulate a sell order at 1% higher
        const sellPrice = buyPrice * 1.01;
        console.log(`Sell order placed at: ${sellPrice}`);
      }

      // Keep the prices array from growing indefinitely
      if (prices.length > periodLong * 2) {
        // Keeping twice the long period worth of prices for accuracy
        prices.shift(); // Remove the oldest price
      }
    }
  });

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
