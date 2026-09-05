import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import type {
  LabelQuery,
  TransactionCursor,
  TransactionInput,
  TransactionQuery,
  WalletInput,
} from "./finance-tracker.contract";

const transactionInclude = {
  wallet: { select: { id: true, name: true, color: true } },
  label: { select: { id: true, name: true } },
} satisfies Prisma.FinanceTransactionInclude;

@Injectable()
export class FinanceTrackerRepository {
  constructor(private readonly prisma: PrismaService) {}

  overviewForUser(userId: string) {
    return this.prisma.$transaction(
      async (db) => {
        const wallets = await db.financeWallet.findMany({
          where: { userId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          include: { _count: { select: { transactions: true } } },
        });
        const totals = await db.financeTransaction.groupBy({
          by: ["walletId", "type"],
          where: { userId },
          _sum: { amount: true },
        });
        return { wallets, totals };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  createWallet(userId: string, input: WalletInput) {
    return this.prisma.$transaction(async (db) => {
      const order = await db.financeWallet.aggregate({
        where: { userId },
        _max: { sortOrder: true },
      });
      return db.financeWallet.create({
        data: { ...input, userId, sortOrder: (order._max.sortOrder ?? -1) + 1 },
      });
    });
  }

  updateWallet(userId: string, id: string, input: WalletInput) {
    return this.prisma.financeWallet.update({
      where: { id_userId: { id, userId } },
      data: input,
    });
  }

  deleteWallet(userId: string, id: string) {
    return this.prisma.financeWallet.delete({
      where: { id_userId: { id, userId } },
    });
  }

  reorderWallets(userId: string, ids: string[]) {
    return this.prisma.$transaction(
      async (db) => {
        const wallets = await db.financeWallet.findMany({
          where: { userId },
          select: { id: true },
        });
        const expected = new Set(wallets.map((wallet) => wallet.id));
        if (
          expected.size !== ids.length ||
          ids.some((id) => !expected.has(id))
        ) {
          return false;
        }
        for (const [sortOrder, id] of ids.entries()) {
          await db.financeWallet.update({
            where: { id_userId: { id, userId } },
            data: { sortOrder },
          });
        }
        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  listTransactions(
    userId: string,
    query: TransactionQuery,
    cursor?: TransactionCursor,
  ) {
    return this.prisma.financeTransaction.findMany({
      where: {
        userId,
        walletId: query.walletId,
        type: query.type,
        ...(cursor && {
          OR: [
            { occurredAt: { lt: new Date(cursor.occurredAt) } },
            { occurredAt: new Date(cursor.occurredAt), id: { lt: cursor.id } },
          ],
        }),
      },
      include: transactionInclude,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
    });
  }

  listLabels(userId: string, query: LabelQuery) {
    return this.prisma.financeLabel.findMany({
      where: {
        userId,
        type: query.type,
        normalizedName: { contains: query.search.toLowerCase() },
      },
      select: { id: true, name: true, type: true },
      orderBy: [{ normalizedName: "asc" }, { id: "asc" }],
      take: 30,
    });
  }

  saveTransaction(userId: string, input: TransactionInput, id?: string) {
    return this.prisma.$transaction(async (db) => {
      const wallet = await db.financeWallet.findUnique({
        where: { id_userId: { id: input.walletId, userId } },
        select: { id: true },
      });
      if (!wallet) return null;
      if (
        id &&
        !(await db.financeTransaction.findFirst({
          where: { id, userId },
          select: { id: true },
        }))
      ) {
        return null;
      }
      const label = await db.financeLabel.upsert({
        where: {
          userId_type_normalizedName: {
            userId,
            type: input.type,
            normalizedName: input.label.toLowerCase(),
          },
        },
        create: {
          userId,
          type: input.type,
          name: input.label,
          normalizedName: input.label.toLowerCase(),
        },
        update: {},
      });
      const data = {
        userId,
        walletId: input.walletId,
        labelId: label.id,
        type: input.type,
        amount: input.amount,
        notes: input.notes || null,
        occurredAt: new Date(input.occurredAt),
      };
      return id
        ? db.financeTransaction.update({
            where: { id, userId },
            data,
            include: transactionInclude,
          })
        : db.financeTransaction.create({ data, include: transactionInclude });
    });
  }

  deleteTransaction(userId: string, id: string) {
    return this.prisma.financeTransaction.delete({ where: { id, userId } });
  }
}
