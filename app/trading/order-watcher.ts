import WebSocket from "ws";
import { db } from "../db";
import { sendEmail } from "../services/postmark";
import { GeminiSocket } from "../web-sockets/gemini-socket";

const apiKey: string = process.env.GEMINI_API_KEY!;
const apiSecret: string = process.env.GEMINI_API_SECRET!;

const BASE_TRADE_AMOUNT = 10;
const SELL_GAIN = 1.01;

// const SHORT_EMA_PERIOD = 30;
// const LONG_EMA_PERIOD = 360;

const SHORT_EMA_PERIOD = 2;
const LONG_EMA_PERIOD = 5;

const MAX_OPEN_ORDERS = 3;

export class OrderWatcher {
  orderEventSocket: GeminiSocket;

  constructor() {
    this.orderEventSocket = new GeminiSocket({
      endpoint: "/v1/order/events",
      messageHandler: this.handleMessage.bind(this),
      api: "private",
    });
  }

  private async handleMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      // Let's only deal with the array messages (ack and heartbeats are not an array)
      if (!Array.isArray(message)) return;

      // console.log("WE GOT AN ORDER EVENT:", message);

      const fillEvents = message.filter((message) => message.type === "fill");

      for await (const fillEvent of fillEvents) {
        if (fillEvent.api_session != process.env.GEMINI_API_KEY) continue; //only deal with order events placed from this server.

        const { client_order_id, symbol, fill, side } = fillEvent;
        const { price: fillPrice, amount } = fill;

        if (side === "buy") {
          console.log("ITS A BUY EVENT");
          let amountSpent = parseFloat(fillPrice) * parseFloat(amount);

          const persistedOrder = await db.trade.create({
            data: {
              id: client_order_id,
              money_spent: parseFloat(amountSpent.toFixed(4)),
              buy_price: parseFloat(fillPrice),
              buy_coin_amount: parseFloat(amount),
              symbol,
            },
          });

          const emailBody = `YO! ORDER PLACED, BOUGHT: ${amountSpent} of ${symbol}`;

          const email = sendEmail({
            subject: "NEW GEMINI ORDER",
            body: emailBody,
          });
        } else if (side === "sell") {
          console.log("ITS A SELL EVENT");
          if (!client_order_id) {
            const emailBody = `Successful sell order placed, but had no corresponding order ID to look up the trade in the DB!! Here is the payload though: 
              ${JSON.stringify(fillEvent)}
              `;

            const email = sendEmail({
              subject: `SALE WITH MISSING ID`,
              body: emailBody,
            });

            return;
          }

          // try to find the corresponding buy
          const originalBuyTrade = await db.trade.findUnique({
            where: {
              id: client_order_id,
            },
          });

          if (!originalBuyTrade) return;
          const { money_spent } = originalBuyTrade;

          const profit =
            parseFloat(fillPrice) * parseFloat(amount) - money_spent;

          console.log(
            "WINNER SALE! 🚀🚀🚀 PROFIT:",
            parseFloat(profit.toFixed(4))
          );

          const updatedTrade = await db.trade.update({
            where: { id: originalBuyTrade.id },
            data: {
              status: "closed",
              win: true,
              profit: parseFloat(profit.toFixed(4)),
              sell_coint_amount: parseFloat(amount),
              sell_price: parseFloat(fillPrice),
            },
          });

          const emailBody = `Successful sell order placed, you profited: ${parseFloat(
            profit.toFixed(4)
          )}`;

          const email = sendEmail({
            subject: `WINNER SALE! 🚀🚀🚀`,
            body: emailBody,
          });
        }
      }
    } catch (error) {
      console.error("ERROR IN MY MINUTE CANDLE LISTENER", error);
    }
  }
}
