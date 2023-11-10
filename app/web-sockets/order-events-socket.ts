import { createHmac } from "crypto";
import WebSocket from "ws";
class OrderEventsWebSocket {
  private ws: WebSocket;

  constructor(private url: string) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_API_SECRET = process.env.GEMINI_API_SECRET!;
    // Create a nonce
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

    // Setup WebSocket connection
    this.ws = new WebSocket("wss://api.gemini.com/v1/order/events", {
      headers: {
        "X-GEMINI-APIKEY": GEMINI_API_KEY,
        "X-GEMINI-PAYLOAD": base64Payload,
        "X-GEMINI-SIGNATURE": signature,
      },
    });

    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", this.onMessage.bind(this));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  private onOpen() {
    console.log("Connected to the Order Events WebSocket server!");
    // const subscribeMessage = {
    //   type: "subscribe",
    //   subscriptions: [{ name: "candles_1m", symbols: ["BTCUSD"] }],
    // };
    // this.ws.send(JSON.stringify(subscribeMessage));
  }

  // Where the magic happens
  private async onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());
      console.log("message", message);
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

export default OrderEventsWebSocket;
