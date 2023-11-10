import WebSocket from "ws";
import { IS_PROD } from "../constants";
import { db } from "../db";
import EmaCalculator from "../trading/ema-calculator";
import { Trader } from "../trading/trader";

const apiKey: string = process.env.GEMINI_API_KEY!;
const apiSecret: string = process.env.GEMINI_API_SECRET!;

const BASE_TRADE_AMOUNT = 10;
const SELL_GAIN = 1.01;

const SHORT_EMA_PERIOD = 30;
const LONG_EMA_PERIOD = 360;

const MAX_OPEN_ORDERS = 1;

//SHORT TERM TEST
// const SHORT_EMA_PERIOD = 2;
// const LONG_EMA_PERIOD = 5;
class MarketDataWebSocket {
  private ws: WebSocket;
  private emaCalculator: EmaCalculator;
  private trader: Trader;
  private prevShortTermEma: number | undefined = undefined;
  private prevLongTermEma: number | undefined = undefined;

  constructor(private url: string) {
    this.ws = new WebSocket(this.url);
    this.emaCalculator = new EmaCalculator(SHORT_EMA_PERIOD, LONG_EMA_PERIOD);
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

  // Where the magic happens
  private async onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === "candles_1m_updates") {
        const candle = message.changes[0];
        const [, , , , close] = candle;

        this.emaCalculator.updatePrice(close);

        console.log("PREVIOUS SHORT TERM EMA: ", this.prevShortTermEma);
        console.log("PREVIOUS LONG TERM EMA: ", this.prevLongTermEma);

        const shortTermEma = this.emaCalculator.getShortTermEma();
        const longTermEma = this.emaCalculator.getLongTermEma();

        console.log("CURRENT SHORT TERM EMA: ", shortTermEma);
        console.log("CURRENT CURRENT LONG TERM EMA: ", longTermEma);

        if (
          shortTermEma &&
          longTermEma &&
          this.prevShortTermEma &&
          this.prevLongTermEma &&
          this.prevShortTermEma <= this.prevLongTermEma &&
          shortTermEma >= longTermEma
        ) {
          console.log(
            "OK BUY SIGNAL, LETS CHECK TO SEE IF WE HAVE ANY OPEN ONES"
          );

          const openOrderCount = await db.trade.count({
            where: { status: "open" },
          });

          console.log("CURRENT OPEN ORDERS: ", openOrderCount);

          if (openOrderCount >= MAX_OPEN_ORDERS || !IS_PROD) return;

          console.log("WE BUYING! 🚀");

          async function calculateTotalForNewTrade(
            defaultValue: number
          ): Promise<number> {
            // Fetch all winning trades
            const winningTrades = await db.trade.findMany({
              where: { win: true },
            });

            // Calculate total profit from winning trades
            const totalProfit = winningTrades.reduce(
              (acc, trade) => acc + (trade.profit || 0),
              0
            );

            // If there's no profit, use the default value
            if (totalProfit === 0) {
              return defaultValue;
            }

            // Otherwise, add the total profit to the default value
            return defaultValue + totalProfit;
          }

          const amountToBuy = await calculateTotalForNewTrade(
            BASE_TRADE_AMOUNT
          );

          // basically a market order
          const order = await this.trader.buy({
            amountUSD: amountToBuy,
            options: ["immediate-or-cancel"],
            executionPriceMultiplier: 1.001,
            symbol: "btcusd",

            type: "exchange limit",
          });

          if (order && order.executed_amount) {
            // OK - buy worked, lets add that to my open buys and set the limit sell
            const {
              client_order_id,
              symbol,
              avg_execution_price,
              executed_amount,
            } = order;

            console.log(`ORDER PLACED, BOUGHT: ${amountToBuy} of ${symbol}`);

            const sellAtLimit = parseFloat(avg_execution_price) * SELL_GAIN;

            const sellOrder = await this.trader.sell({
              symbol,
              sellAmount: executed_amount,
              sellAtPrice: sellAtLimit.toString(),
              orderId: client_order_id,
            });

            console.log("SELL ORDER PLACED", sellOrder);
          }
        }

        // Store the current EMA values for the next comparison
        this.prevShortTermEma = shortTermEma;
        this.prevLongTermEma = longTermEma;
      }
    } catch (error) {
      console.error("ERROR IN MY MINUTE CANDLE LISTENER", error);
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
