import WebSocket from "ws";
import EmaCalculator from "../trading/ema-calculator";
import { Trader } from "../trading/trader";

const apiKey: string = process.env.GEMINI_API_KEY!;
const apiSecret: string = process.env.GEMINI_API_SECRET!;

class MarketDataWebSocket {
  private ws: WebSocket;
  private emaCalculator: EmaCalculator;
  private trader: Trader;

  constructor(private url: string) {
    this.ws = new WebSocket(this.url);
    this.emaCalculator = new EmaCalculator(2, 6);
    this.trader = new Trader(apiKey, apiSecret);
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", this.onMessage.bind(this));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  private onOpen() {
    console.log("Connected to the MarketData WebSocket server!");
    const subscribeMessage = {
      type: "subscribe",
      subscriptions: [{ name: "candles_1m", symbols: ["BTCUSD"] }],
    };
    this.ws.send(JSON.stringify(subscribeMessage));
  }

  private async onMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString());
    if (message.type === "candles_1m_updates") {
      const candle = message.changes[0];
      const [, , , , close] = candle;

      console.log("ok got a new message, here is close", close);
      this.emaCalculator.updatePrice(close);

      // Access EMA values if needed
      const shortTermEma = this.emaCalculator.getShortTermEma();
      const longTermEma = this.emaCalculator.getLongTermEma();

      await this.trader.buy({
        amountUSD: 5,
        options: ["maker-or-cancel"],
        executionPriceMultiplier: 0.5,
        symbol: "btcusd",
        side: "buy",
        type: "exchange limit",
      });

      if (shortTermEma && longTermEma && shortTermEma > longTermEma) {
        console.log("WE BUYING!");
      }

      console.log("short term ema", shortTermEma);
      console.log("long term ema", longTermEma);
    }
  }

  private onClose() {
    console.log("Disconnected from the MarketData WebSocket server!");
    // Handle reconnection logic here
  }

  private onError(error: Error) {
    console.error("WebSocket error:", error);
    // Handle error and possible reconnection logic here
  }
}

export default MarketDataWebSocket;
