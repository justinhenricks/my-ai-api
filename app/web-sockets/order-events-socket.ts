import { createHmac } from "crypto";
import WebSocket from "ws";
import { db } from "../db";
import { sendEmail } from "../services/postmark";
class OrderEventsWebSocket {
  private ws: WebSocket;
  private lastHeartbeat: number;
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor(private url: string) {
    const headers = this.getHeaders();
    // Create a nonce
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = undefined; // Initialize here
    // Setup WebSocket connection
    this.ws = new WebSocket("wss://api.gemini.com/v1/order/events", {
      headers,
    });

    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", this.onMessage.bind(this));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  private getHeaders() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_API_SECRET = process.env.GEMINI_API_SECRET!;
    const nonce = Date.now();

    // Create the payload
    const payload = {
      request: "/v1/order/events",
      nonce,
    };

    // Stringify and Base64 encode the payload
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );

    // Create the signature
    const signature = createHmac("sha384", GEMINI_API_SECRET)
      .update(base64Payload)
      .digest("hex");

    return {
      "X-GEMINI-APIKEY": GEMINI_API_KEY,
      "X-GEMINI-PAYLOAD": base64Payload,
      "X-GEMINI-SIGNATURE": signature,
    };
  }

  private onOpen() {
    console.log("Connected to the Order Events WebSocket server!");
    // Start checking for heartbeats every 5 seconds
    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastHeartbeat > 6000) {
        console.log("Missed heartbeat. Reconnecting...");
        this.reconnect();
      }
    }, 5000);
  }

  private async onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "heartbeat") {
        console.log(
          `ORDER EVENT HEARTBEAT ❤️ ${message.timestampms} - ${message.trace_id}`
        );
        this.lastHeartbeat = message.timestampms;
      }

      // Let's only deal with the array messages (ack and heartbeats are not an array)
      if (!Array.isArray(message)) return;

      console.log("WE GOT AN ORDER EVENT:", message);

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

  private onClose() {
    console.log("Disconnected from the MarketData WebSocket server!");
    clearInterval(this.heartbeatInterval);
    // Handle reconnection logic here
  }

  private onError(error: Error) {
    console.error("WebSocket error:", error);
    // Handle error and possible reconnection logic here
  }

  private reconnect() {
    this.ws.close();
    const headers = this.getHeaders();
    this.ws = new WebSocket(this.url, {
      headers,
    });
    // Reattach all event listeners
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", this.onMessage.bind(this));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }
}

export default OrderEventsWebSocket;
