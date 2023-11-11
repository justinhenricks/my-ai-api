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
    // this.headers = this.getHeaders();
    this.id = id;
    this.headers = headers; // Use the passed headers

    console.log("do i have headers? ", this.headers);

    console.log("here is url", url);
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
    console.log("in setup here is message handler", this.messageHandler);
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
    // Reconnection logic
  }

  protected reconnect() {
    console.log(`Reconnecting to WebSocket: ${this.id}`);
    this.ws.close();
    const headers = this.getHeaders();
    this.ws = new WebSocket(this.url, {
      headers,
    });
    // Reattach all event listeners
    this.setupEventListeners();
  }

  protected onError(error: Error) {
    console.error(`WebSocket ${this.id} error:`, error);
    // Error handling
  }
}
