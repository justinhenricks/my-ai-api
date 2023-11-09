import WebSocket from "ws";

class MarketDataWebSocket {
  private ws: WebSocket;

  constructor(
    private url: string // private onNewPrice: (price: number) => void
  ) {
    this.ws = new WebSocket(this.url);
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

  private onMessage(data: WebSocket.Data) {
    const message = JSON.parse(data.toString());
    if (message.type === "candles_1m_updates") {
      const candle = message.changes[0];
      const [, , , , close] = candle;

      console.log("ok got a new message, here is close", close);
      //   this.onNewPrice(close);
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
