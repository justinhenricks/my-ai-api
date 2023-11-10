import { v4 as uuidv4 } from "uuid";
import { GeminiApiClient, NewOrderRequest } from "../services/gemini"; // Replace with actual import

export class Trader {
  private client: GeminiApiClient;
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.client = new GeminiApiClient(apiKey, apiSecret);
  }

  // Utilize this method to execute trades based on the strategy
  public async buy({
    amountUSD,
    executionPriceMultiplier, //limit price, .5 for half of what the current ask is, ie
    ...orderDetails
  }: {
    amountUSD: number;
    executionPriceMultiplier: number;
  } & Pick<NewOrderRequest, "symbol" | "side" | "type" | "options">) {
    try {
      const { symbol, side, type, options } = orderDetails;
      const ticker = await this.client.getTicker(symbol);
      const details = await this.client.getSymbolDetails(symbol);
      const tickSize = details.tick_size;
      const orderId = uuidv4();

      console.log("orderId", orderId);

      const executionPrice = (ticker.ask * executionPriceMultiplier).toFixed(2);
      const amountOfCoin = this.calculateAmountOfCoin(
        amountUSD,
        executionPrice,
        tickSize
      );

      console.log("Execution price:", executionPrice);
      console.log("Amount of coin:", amountOfCoin);

      // Now, place the order using the Gemini API client
      //   const orderResponse = await this.client.newOrder({
      //     symbol: symbol,
      //     client_order_id: orderId,
      //     type,
      //     side,
      //     options,
      //     amount: amountOfCoin.toString(),
      //     price: executionPrice,
      //   });

      //   console.log("Order placed:", orderResponse);
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  }

  private calculateExecutionPrice(ask: number, tickSize: number): string {
    const adjustedPrice = ask * 0.5;
    return adjustedPrice.toFixed(this.getDecimalPlaces(tickSize));
  }

  private calculateAmountOfCoin(
    totalSpendAmount: number,
    executionPrice: string,
    tickSize: number
  ): number {
    const amount = totalSpendAmount / parseFloat(executionPrice);
    return this.roundToTickSize(amount, tickSize);
  }

  private roundToTickSize(number: number, tickSize: number): number {
    const decimalPlaces = this.getDecimalPlaces(tickSize);
    const factor = Math.pow(10, decimalPlaces);
    const roundedNumber =
      (Math.round((number * factor) / tickSize) * tickSize) / factor;
    return Number(roundedNumber.toFixed(decimalPlaces));
  }

  private getDecimalPlaces(tickSize: number): number {
    const tickSizePower = Math.log10(tickSize);
    return tickSizePower < 0 ? Math.abs(tickSizePower) : 0;
  }
}
