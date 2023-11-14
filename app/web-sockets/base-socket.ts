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

  protected setupEventListeners() {
    this.ws.on("open", this.onOpen.bind(this));
    this.ws.on("message", (data) => this.messageHandler(data));
    this.ws.on("close", this.onClose.bind(this));
    this.ws.on("error", this.onError.bind(this));
  }

  protected abstract onOpen(): void;

  protected abstract handleSubscriptions(): void;

  protected abstract onClose(): void;

  protected abstract reconnect(): void;

  protected abstract onError(error: Error): void;
}
