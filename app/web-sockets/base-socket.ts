import WebSocket from "ws";

export type MessageHandler = (data: WebSocket.Data) => void;

export abstract class BaseWebSocket {
  protected ws: WebSocket;
  protected id: string;
  protected messageHandler: MessageHandler;
  protected headers: {};

  constructor(
    protected url: string,
    messageHandler: MessageHandler,
    id: string,
    headers: {}
  ) {
    this.messageHandler = messageHandler;
    this.id = id;
    this.headers = headers;
    this.ws = new WebSocket(url, {
      headers: this.headers,
    });
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", (data) => this.messageHandler(data));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  protected onOpen() {
    console.log(`Connected to WebSocket ${this.id} server!`);
    this.handleSubscriptions();
  }

  protected handleSubscriptions() {
    console.log(
      `No subscriptions registered for ${this.id} - override this function to handle subscriptions.`
    );
  }

  protected onClose() {
    console.log(`Disconnected from WebSocket ${this.id} server!`);
  }

  protected reconnect() {
    console.log(`Reconnecting to WebSocket: ${this.id}`);
    this.ws.close();
    const headers = this.headers;
    this.ws = new WebSocket(this.url, {
      headers,
    });
    // Reattach all event listeners
    this.setupEventListeners();
  }

  protected onError(error: Error) {
    console.error(`WebSocket ${this.id} error:`, error);
  }
}
