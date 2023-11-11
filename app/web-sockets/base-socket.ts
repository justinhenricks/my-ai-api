import WebSocket from "ws";

export type MessageHandler = (data: WebSocket.Data) => void;

export abstract class BaseWebSocket {
  protected ws: WebSocket;
  protected messageHandler: MessageHandler;

  constructor(protected url: string, messageHandler: MessageHandler) {
    this.messageHandler = messageHandler;
    // pass in headers?
    this.ws = new WebSocket(url);
    this.setupEventListeners();
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

  protected abstract handleSubscriptions(): void;

  protected onClose() {
    console.log("Disconnected from WebSocket server!");
    // Reconnection logic
  }

  protected onError(error: Error) {
    console.error("WebSocket error:", error);
    // Error handling
  }
}
