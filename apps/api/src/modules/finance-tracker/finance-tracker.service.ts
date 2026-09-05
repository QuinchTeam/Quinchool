import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import {
  type LabelQuery,
  type TransactionInput,
  type TransactionQuery,
  transactionCursorSchema,
  type WalletInput,
} from "./finance-tracker.contract";
import { FinanceTrackerRepository } from "./finance-tracker.repository";

@Injectable()
export class FinanceTrackerService {
  constructor(private readonly repository: FinanceTrackerRepository) {}

  async getOverview(userId: string) {
    const { wallets, totals } = await this.repository.overviewForUser(userId);
    const balances = new Map(
      wallets.map((wallet) => [wallet.id, wallet.openingBalance]),
    );
    for (const total of totals) {
      const amount = total._sum.amount ?? new Prisma.Decimal(0);
      const balance = balances.get(total.walletId) ?? new Prisma.Decimal(0);
      balances.set(
        total.walletId,
        total.type === "INCOME" ? balance.plus(amount) : balance.minus(amount),
      );
    }
    const totalBalance = [...balances.values()].reduce(
      (sum, balance) => sum.plus(balance),
      new Prisma.Decimal(0),
    );
    return {
      userId,
      currency: "PHP" as const,
      totalBalance: totalBalance.toFixed(2),
      wallets: wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        color: wallet.color,
        openingBalance: wallet.openingBalance.toFixed(2),
        balance: (balances.get(wallet.id) ?? wallet.openingBalance).toFixed(2),
        transactionCount: wallet._count.transactions,
      })),
    };
  }

  async createWallet(userId: string, input: WalletInput) {
    const wallet = await this.write(() =>
      this.repository.createWallet(userId, input),
    );
    return { id: wallet.id };
  }

  async updateWallet(userId: string, id: string, input: WalletInput) {
    const wallet = await this.write(() =>
      this.repository.updateWallet(userId, id, input),
    );
    return { id: wallet.id };
  }

  async deleteWallet(userId: string, id: string) {
    await this.write(
      () => this.repository.deleteWallet(userId, id),
      "This wallet has transactions. Move or delete them before deleting the wallet.",
    );
  }

  async reorderWallets(userId: string, ids: string[]) {
    const reordered = await this.write(() =>
      this.repository.reorderWallets(userId, ids),
    );
    if (!reordered) {
      throw new ConflictException({
        error: "Wallets changed. Refresh and reorder again.",
      });
    }
  }

  async listTransactions(userId: string, query: TransactionQuery) {
    let cursor: ReturnType<typeof transactionCursorSchema.parse> | undefined;
    if (query.cursor) {
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(query.cursor))
          throw new Error("Invalid cursor");
        cursor = transactionCursorSchema.parse(
          JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8")),
        );
      } catch {
        throw new BadRequestException({ error: "Invalid transaction cursor." });
      }
    }
    const rows = await this.repository.listTransactions(userId, query, cursor);
    const items = rows.slice(0, query.limit);
    const last = items.at(-1);
    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        amount: item.amount.toFixed(2),
        notes: item.notes,
        occurredAt: item.occurredAt.toISOString(),
        wallet: item.wallet,
        label: item.label,
      })),
      nextCursor:
        rows.length > query.limit && last
          ? Buffer.from(
              JSON.stringify({
                id: last.id,
                occurredAt: last.occurredAt.toISOString(),
              }),
            ).toString("base64url")
          : null,
    };
  }

  listLabels(userId: string, query: LabelQuery) {
    return this.repository.listLabels(userId, query);
  }

  async saveTransaction(userId: string, input: TransactionInput, id?: string) {
    const transaction = await this.write(() =>
      this.repository.saveTransaction(userId, input, id),
    );
    if (!transaction)
      throw new NotFoundException({
        error: "Wallet or transaction not found.",
      });
    return { id: transaction.id };
  }

  async deleteTransaction(userId: string, id: string) {
    await this.write(() => this.repository.deleteTransaction(userId, id));
  }

  private async write<T>(
    operation: () => Promise<T>,
    relationError = "Related wallet or label changed. Refresh and try again.",
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025")
          throw new NotFoundException({
            error: "Wallet or transaction not found.",
          });
        if (error.code === "P2003")
          throw new ConflictException({ error: relationError });
        if (error.code === "P2034" || error.code === "P2002") {
          throw new ConflictException({
            error: "Finance data changed at the same time. Please try again.",
          });
        }
      }
      throw error;
    }
  }
}
