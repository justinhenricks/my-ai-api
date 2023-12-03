import WebSocket from "ws";
import { db } from "../db";
import { GeminiSocket } from "../web-sockets/gemini-socket";

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

      console.log("HERE IS MESSAGE", message);

      const fillEvents = message.filter((message) => message.type === "fill"); //If we want to create a more complicated model where we associate many fills with orders, this is what we'd use
      const closeEvents = message.filter(
        (message) => message.type === "closed"
      );

      /**
       * Only going to deal with tracking 'closed' events for now, as we know the buy or sell has been fully executed at that point.
       *
       * Going to use the avg_execution_price * executed_amount to give the *actual* amount of $$ spent or gained. After doing some testing, it seems
       * this is the actual number that is deducted or added to my balance, so seems most accurate to just use that.
       */

      for await (const closeEvent of closeEvents) {
        if (closeEvent.api_session != process.env.GEMINI_API_KEY) continue; //only deal with order events placed from this server.

        const {
          client_order_id,
          symbol,
          side,
          avg_execution_price,
          executed_amount,
          price,
        } = closeEvent;

        if (side === "buy") {
          console.log("ITS A BUY EVENT");
          let amountSpent =
            parseFloat(avg_execution_price) * parseFloat(executed_amount);

          const persistedOrder = await db.trade.create({
            data: {
              id: client_order_id,
              money_spent: parseFloat(amountSpent.toFixed(4)),
              buy_price: parseFloat(avg_execution_price),
              buy_coin_amount: parseFloat(executed_amount),
              symbol,
            },
          });
        } else if (side === "sell") {
          console.log("ITS A SELL EVENT");
          if (!client_order_id) {
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

          const grossSaleTotal =
            parseFloat(price) * parseFloat(executed_amount);

          const netSaleTotalLessFee = grossSaleTotal - grossSaleTotal * 0.002;

          const profit = netSaleTotalLessFee - money_spent;

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
              sell_coint_amount: parseFloat(executed_amount),
              sell_price: parseFloat(avg_execution_price),
            },
          });
        }
      }
    } catch (error) {
      console.error("ERROR IN MY MINUTE CANDLE LISTENER", error);
    }
  }
}
