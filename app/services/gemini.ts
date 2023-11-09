import { createHmac } from "crypto";
import { GEMINI_REST_API_BASE_URL } from "../constants";

interface BalanceResponse {
  // Define types according to the Gemini API response for balance
  currency: string;
  amount: string;
  available: string;
}

interface Payload {
  request: string;
  nonce: number;
}

type OrderExecutionOptions =
  | "maker-or-cancel"
  | "immediate-or-cancel"
  | "fill-or-kill";

interface NewOrderRequest {
  client_order_id: string;
  symbol: string;
  amount: string;
  price: string;
  side: "buy" | "sell";
  type: "exchange limit" | "exchange stop limit";
  options?: OrderExecutionOptions[];
  stop_price?: string;
  account?: string;
}

interface NewOrderResponse {
  order_id: string;
  id: string;
  symbol: string;
  exchange: string;
  avg_execution_price: string;
  side: string;
  type: string;
  timestamp: string;
  timestampms: number;
  is_live: boolean;
  is_cancelled: boolean;
  is_hidden: boolean;
  was_forced: boolean;
  executed_amount: string;
  remaining_amount: string;
  options: string[];
  price: string;
  original_amount: string;
  // Add any additional fields you need to handle in the response
}

export class GeminiApiClient {
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;

  constructor(
    apiKey: string,
    apiSecret: string,
    baseURL: string = GEMINI_REST_API_BASE_URL
  ) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = baseURL;
  }

  private getNonce(): number {
    return Date.now();
  }

  private signPayload(payload: Payload): {
    payloadEnc: string;
    signature: string;
  } {
    const payloadEnc = Buffer.from(JSON.stringify(payload)).toString("base64");
    const signature = createHmac("sha384", this.apiSecret)
      .update(payloadEnc)
      .digest("hex");
    return { payloadEnc, signature };
  }

  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST",
    additionalPayload: object = {},
    needAuth: boolean = true
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    const options: RequestInit = {
      method: method,
      headers: {},
    };

    if (needAuth) {
      const payload: Payload = {
        request: endpoint,
        nonce: this.getNonce(),
        ...additionalPayload,
      };

      const { payloadEnc, signature } = this.signPayload(payload);

      options.headers = {
        "Content-Type": "text/plain",
        "Content-Length": "0",
        "X-GEMINI-APIKEY": this.apiKey,
        "X-GEMINI-PAYLOAD": payloadEnc,
        "X-GEMINI-SIGNATURE": signature,
        "Cache-Control": "no-cache",
      };
    }

    const response = await fetch(url, options);
    return response.json();
  }

  // Public endpoint
  public async getTicker(symbol: string): Promise<any> {
    return this.makeRequest(`/v2/ticker/${symbol}`, "GET", {}, false);
  }

  // Private endpoint
  public async newOrder(orderData: NewOrderRequest): Promise<NewOrderResponse> {
    return this.makeRequest("/v1/order/new", "POST", orderData);
  }

  // Private endpoint
  public async getBalances(): Promise<BalanceResponse[]> {
    return this.makeRequest("/v1/balances", "POST");
  }
}
