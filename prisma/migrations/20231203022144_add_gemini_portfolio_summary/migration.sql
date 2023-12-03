-- CreateTable
CREATE TABLE "GeminiPortfolioSummary" (
    "id" TEXT NOT NULL,
    "open_trades" INTEGER NOT NULL,
    "cash_balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeminiPortfolioSummary_pkey" PRIMARY KEY ("id")
);
