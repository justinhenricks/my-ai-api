import { createHmac } from "crypto";
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
  constructor({
    endpoint,
    messageHandler,
    api,
    subscriptions,
  }: GeminiSocketConstructorParams) {
    const url = `wss://api.gemini.com${endpoint}`;
    super(url, messageHandler);
    this.api = api;
    this.endpoint = endpoint;
    this.subscriptions = subscriptions;
  }

  getHeaders() {
    if (this.api === "public") return {};
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_API_SECRET = process.env.GEMINI_API_SECRET!;
    const nonce = Date.now();

    // Create the payload
    const payload = {
      request: this.endpoint,
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

  protected handleSubscriptions() {
    if (!this.subscriptions) return;

    const subscriptionsArray = Array.isArray(this.subscriptions)
      ? this.subscriptions
      : [this.subscriptions];

    subscriptionsArray.forEach((subscription) => {
      this.ws.send(JSON.stringify(subscription));
    });
  }
}
