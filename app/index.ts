import "dotenv/config";
import express from "express";
import WebSocket from "ws";
import { IS_PROD, PORT } from "./constants";
import "./crons/runner"; // This schedules the cron jobs
import { router } from "./routes";
import { GeminiSocket } from "./web-sockets/gemini-socket";
async function main() {
  const app = express();

  app.use(express.json());
  app.use(router);

  // const marketDataSocket = new MarketDataWebSocket(
  //   `${GEMINI_PUBLIC_WS_BASE_URL}/v2/marketdata/BTCUSD`
  // );

  // const orderEventSocket = new OrderEventsWebSocket(
  //   `wss://api.gemini.com/v1/order/events`
  // );

  const geminiPublicSocket = new GeminiSocket({
    endpoint: "/v2/marketdata/BTCUSD",
    messageHandler: (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "candles_1m_updates") {
        const candle = message.changes[0];
        const [, , , , close] = candle;

        console.log("here is close", close);
      }
    },
    api: "public",
    subscriptions: [
      {
        type: "subscribe",
        subscriptions: [{ name: "candles_1m", symbols: ["BTCUSD"] }],
      },
    ],
  });

  app.listen(PORT, () => {
    console.log(
      `🚀 Server is running on port: ${PORT} and in ${
        IS_PROD ? "production" : "development."
      }`
    );
  });
}

main();
