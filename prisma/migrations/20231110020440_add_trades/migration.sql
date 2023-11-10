-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('open', 'closed');

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "buy_price" DOUBLE PRECISION NOT NULL,
    "buy_coin_amount" DOUBLE PRECISION NOT NULL,
    "money_spent" DOUBLE PRECISION NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'open',
    "win" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);
