-- CreateEnum
CREATE TYPE "FinanceWalletType" AS ENUM ('CASH', 'EWALLET', 'TRADITIONAL_BANK', 'DIGITAL_BANK');

-- CreateEnum
CREATE TYPE "FinanceTransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "finance_wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "FinanceWalletType" NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(240) NOT NULL,
    "type" "FinanceTransactionType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "type" "FinanceTransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "notes" VARCHAR(1000),
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_wallet_userId_sortOrder_id_idx" ON "finance_wallet"("userId", "sortOrder", "id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_wallet_id_userId_key" ON "finance_wallet"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "finance_label_userId_type_normalizedName_key" ON "finance_label"("userId", "type", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "finance_label_id_userId_type_key" ON "finance_label"("id", "userId", "type");

-- CreateIndex
CREATE INDEX "finance_transaction_userId_occurredAt_id_idx" ON "finance_transaction"("userId", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "finance_transaction_userId_walletId_occurredAt_id_idx" ON "finance_transaction"("userId", "walletId", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "finance_transaction_userId_type_occurredAt_id_idx" ON "finance_transaction"("userId", "type", "occurredAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "finance_transaction_labelId_userId_type_idx" ON "finance_transaction"("labelId", "userId", "type");

-- AddForeignKey
ALTER TABLE "finance_wallet" ADD CONSTRAINT "finance_wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_label" ADD CONSTRAINT "finance_label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transaction" ADD CONSTRAINT "finance_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transaction" ADD CONSTRAINT "finance_transaction_walletId_userId_fkey" FOREIGN KEY ("walletId", "userId") REFERENCES "finance_wallet"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transaction" ADD CONSTRAINT "finance_transaction_labelId_userId_type_fkey" FOREIGN KEY ("labelId", "userId", "type") REFERENCES "finance_label"("id", "userId", "type") ON DELETE RESTRICT ON UPDATE CASCADE;
