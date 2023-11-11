import WebSocket from "ws";

export type MessageHandler = (data: WebSocket.Data) => void;

export abstract class BaseWebSocket {
  protected ws: WebSocket;
  protected messageHandler: MessageHandler;
  protected headers: {};

  constructor(protected url: string, messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
    this.headers = this.getHeaders();
    this.ws = new WebSocket(url, {
      headers: this.headers,
    });
    this.setupEventListeners();
  }

  protected getHeaders() {
    console.log(
      "No headers registered - override this function to return an onject of headers."
    );

    return {};
  }

  private setupEventListeners() {
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", (data) => this.messageHandler(data));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  protected onOpen() {
    console.log("Connected to WebSocket server!");
    this.handleSubscriptions();
  }

  protected handleSubscriptions() {
    console.log(
      "No subscriptions registered - override this function to handle subscriptions."
    );
  }

  protected onClose() {
    console.log("Disconnected from WebSocket server!");
    // Reconnection logic
  }

  protected onError(error: Error) {
    console.error("WebSocket error:", error);
    // Error handling
  }
}
