import { createHmac } from "crypto";
import WebSocket from "ws";
import { BaseWebSocket, MessageHandler } from "./base-socket";

export type Subscription = {
  type: string;
  subscriptions: any[]; // Define the structure based on your requirements
};

interface GeminiSocketConstructorParams {
  endpoint: string;
  messageHandler: MessageHandler;
  api: "public" | "private";
  subscriptions?: Subscription | Subscription[];
}

export class GeminiSocket extends BaseWebSocket {
  private subscriptions: Subscription | Subscription[] | undefined;
  private api: "public" | "private";
  private endpoint: string;
  private lastHeartbeat: number;
  private heartbeatInterval: NodeJS.Timeout | undefined;

  constructor({
    endpoint,
    messageHandler,
    api,
    subscriptions,
  }: GeminiSocketConstructorParams) {
    const url = `wss://api.gemini.com${endpoint}`;

    const wrappedMessageHandler: MessageHandler = (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());

      // Update heartbeat if the message is a heartbeat message
      if (this.isHeartbeatMessage(message)) {
        console.log(`${this.id} Heartbeat ❤️`);
        this.updateLastHeartbeat();
      }

      // Call the original message handler
      messageHandler(data);
    };

    const headers = GeminiSocket.createHeaders(api, endpoint);

    super(url, wrappedMessageHandler, endpoint, headers);
    this.api = api;
    this.endpoint = endpoint;
    this.subscriptions = subscriptions;
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = undefined;
  }

  private static createHeaders(api: "public" | "private", endpoint: string) {
    if (api === "public") return {};

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_API_SECRET = process.env.GEMINI_API_SECRET!;
    const nonce = Date.now();

    // Create the payload
    const payload = {
      request: endpoint,
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

  protected onOpen(): void {
    console.log(`CONNECTED TO GEMINI ${this.id} socket!`);
    this.handleSubscriptions();

    console.log(`SETTING ${this.id} HEARTBEAT CHECKER`);
    this.heartbeatInterval = setInterval(() => {
      if (Date.now() - this.lastHeartbeat > 5000) {
        console.log(`Missed ${this.id} heartbeat. Reconnecting...`);
        this.reconnect();
      }
    }, 6000);
  }

  protected onClose(): void {
    console.log(`Closed ${this.id} web socket`);
  }

  protected handleSubscriptions() {
    if (!this.subscriptions) return;

    const subscriptionsArray = Array.isArray(this.subscriptions)
      ? this.subscriptions
      : [this.subscriptions];

    subscriptionsArray.forEach((subscription) => {
      this.ws.send(JSON.stringify(subscription));
    });
  }

  private isHeartbeatMessage(message: any) {
    return message.type === "heartbeat";
  }

  private updateLastHeartbeat(): void {
    this.lastHeartbeat = Date.now();
  }
}
