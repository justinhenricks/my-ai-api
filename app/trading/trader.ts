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
  } & Pick<NewOrderRequest, "symbol" | "type" | "options">) {
    try {
      const { symbol, type, options } = orderDetails;
      const ticker = await this.client.getTicker(symbol);
      const details = await this.client.getSymbolDetails(symbol);
      const tickSize = details.tick_size;
      const orderId = uuidv4();

      const executionPrice = (ticker.ask * executionPriceMultiplier).toFixed(2);
      const amountOfCoin = this.calculateAmountOfCoin(
        amountUSD,
        executionPrice,
        tickSize
      );

      console.log("Execution price:", executionPrice);
      console.log("Amount of coin:", amountOfCoin);

      // Now, place the order using the Gemini API client
      const orderResponse = await this.client.newOrder({
        symbol: symbol,
        client_order_id: orderId,
        type,
        side: "buy",
        options,
        amount: amountOfCoin.toString(),
        price: executionPrice,
      });

      return orderResponse;
      /**
            {
            order_id: '200043297786',
            id: '200043297786',
            symbol: 'btcusd',
            exchange: 'gemini',
            avg_execution_price: '0.00',
            side: 'buy',
            type: 'exchange limit',
            timestamp: '1699540685',
            timestampms: 1699540685513,
            is_live: true,
            is_cancelled: false,
            is_hidden: false,
            was_forced: false,
            executed_amount: '0',
            client_order_id: '15862b28-bf54-46ac-b602-0d8c03065467',
            options: [ 'maker-or-cancel' ],
            price: '18849.06',
            original_amount: '0.00026527',
            remaining_amount: '0.00026527'
            }
       */
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  }

  public async sell({
    symbol,
    sellAtPrice,
    sellAmount,
    orderId,
  }: {
    symbol: string;
    sellAmount: string;
    sellAtPrice: string;
    orderId: string;
  }) {
    const orderResponse = await this.client.newOrder({
      symbol: symbol,
      type: "exchange limit",
      client_order_id: orderId,
      side: "sell",
      options: ["maker-or-cancel"],
      amount: sellAmount,
      price: parseFloat(sellAtPrice).toFixed(2),
    });

    return orderResponse;
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
