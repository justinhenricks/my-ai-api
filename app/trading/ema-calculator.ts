class EmaCalculator {
  private shortTermPeriod: number;
  private longTermPeriod: number;
  private prevShortTermEma: number | undefined;
  private prevLongTermEma: number | undefined;
  private priceHistory: number[] = [];

  constructor(shortTermPeriod: number, longTermPeriod: number) {
    this.shortTermPeriod = shortTermPeriod;
    this.longTermPeriod = longTermPeriod;
  }

  public updatePrice(newPrice: number): void {
    this.priceHistory.push(newPrice);

    // Ensure we don't keep more prices than necessary
    if (this.priceHistory.length > this.longTermPeriod) {
      this.priceHistory.shift(); // Remove the oldest price
    }

    this.calculateEmas();
  }

  private calculateEmas(): void {
    // Calculate the short-term EMA if we have enough data points
    if (this.priceHistory.length >= this.shortTermPeriod) {
      let newShortTermEma = this.calculateEma(
        this.priceHistory.slice(-this.shortTermPeriod),
        this.shortTermPeriod,
        this.prevShortTermEma
      );
      if (newShortTermEma !== undefined) {
        this.prevShortTermEma = newShortTermEma;
      }
    }

    // Calculate the long-term EMA if we have enough data points
    if (this.priceHistory.length >= this.longTermPeriod) {
      let newLongTermEma = this.calculateEma(
        this.priceHistory,
        this.longTermPeriod,
        this.prevLongTermEma
      );
      if (newLongTermEma !== undefined) {
        this.prevLongTermEma = newLongTermEma;
      }
    }
  }

  private calculateEma(
    prices: number[],
    period: number,
    prevEma: number | undefined
  ): number | undefined {
    const k = 2 / (period + 1);

    if (prevEma === undefined && prices.length >= period) {
      prevEma = this.calculateSma(prices, period);
    }

    if (prevEma === undefined) {
      return undefined;
    }

    const latestPrice = prices[prices.length - 1];
    return (latestPrice - prevEma) * k + prevEma;
  }

  private calculateSma(prices: number[], period: number): number {
    const sum = prices.reduce((acc, val) => acc + val, 0);
    return sum / period;
  }

  public getShortTermEma(): number | undefined {
    return this.prevShortTermEma;
  }

  public getLongTermEma(): number | undefined {
    return this.prevLongTermEma;
  }
}

export default EmaCalculator;
