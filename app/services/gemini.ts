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
    return Date.now(); // Nonce as current timestamp in milliseconds
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
    additionalPayload: object = {}
  ): Promise<any> {
    const payload: Payload = {
      request: `/v1${endpoint}`,
      nonce: this.getNonce(),
      ...additionalPayload,
    };

    const { payloadEnc, signature } = this.signPayload(payload);

    const headers = {
      "Content-Type": "text/plain",
      "Content-Length": "0",
      "X-GEMINI-APIKEY": this.apiKey,
      "X-GEMINI-PAYLOAD": payloadEnc,
      "X-GEMINI-SIGNATURE": signature,
      "Cache-Control": "no-cache",
    };

    console.log("about to make fetch", `${this.baseURL}${payload.request}`);

    const response = await fetch(`${this.baseURL}${payload.request}`, {
      method: "POST",
      headers: headers,
    });

    return response.json();
  }

  // Example function to get the account balance
  public async getBalances(): Promise<BalanceResponse[]> {
    return this.makeRequest("/balances");
  }

  // Add more methods to interact with other endpoints...
}
