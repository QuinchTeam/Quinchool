import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma/prisma.service";
import { Prisma } from "../../generated/prisma/client";
import type {
  LabelQuery,
  SummaryQuery,
  TransactionInput,
  TransactionQuery,
  TransferInput,
  WalletInput,
} from "./finance-tracker.contract";

const transactionInclude = {
  wallet: { select: { id: true, name: true, color: true } },
  label: { select: { id: true, name: true } },
} satisfies Prisma.FinanceTransactionInclude;

const SUMMARY_BUCKETS = {
  day: "hour",
  week: "day",
  month: "day",
  year: "month",
} as const;

const TRANSACTION_SORTS = {
  newest: { field: "occurredAt", direction: "desc" },
  oldest: { field: "occurredAt", direction: "asc" },
  highest: { field: "amount", direction: "desc" },
  lowest: { field: "amount", direction: "asc" },
} as const;

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

  listTransactions(userId: string, query: TransactionQuery) {
    const { field, direction } = TRANSACTION_SORTS[query.sort];
    const where: Prisma.FinanceTransactionWhereInput = {
      userId,
      walletId: query.walletId,
      type: query.type,
      occurredAt: {
        gte: query.from && new Date(query.from),
        lt: query.to && new Date(query.to),
      },
      // Transfers use generated Transfer to/from wallet label pairs.
      ...(query.excludeTransfers && {
        label: {
          NOT: [
            { name: { startsWith: "Transfer to " } },
            { name: { startsWith: "Transfer from " } },
          ],
        },
      }),
      ...(query.search && {
        OR: [
          { label: { name: { contains: query.search, mode: "insensitive" } } },
          { notes: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };
    return this.prisma.$transaction([
      this.prisma.financeTransaction.findMany({
        where,
        include: transactionInclude,
        orderBy: [{ [field]: direction }, { id: direction }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.financeTransaction.count({ where }),
    ]);
  }

  // Fill empty Manila-time buckets so gaps do not collapse the chart.
  summaryForUser(userId: string, period: SummaryQuery["period"]) {
    const bucket = SUMMARY_BUCKETS[period];
    // shortcut: transfer detection depends on label names; use a flag if users can create matching labels.
    return this.prisma.$queryRaw<
      { bucket: string; income: string; expense: string }[]
    >`
      WITH bounds AS (
        SELECT date_trunc(${period}::text, now() AT TIME ZONE 'Asia/Manila') AS start
      )
      SELECT
        to_char(s.bucket, 'YYYY-MM-DD"T"HH24:MI') AS bucket,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0)::text AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE'), 0)::text AS expense
      FROM bounds b
      CROSS JOIN generate_series(
        b.start,
        b.start + ('1 ' || ${period}::text)::interval - ('1 ' || ${bucket}::text)::interval,
        ('1 ' || ${bucket}::text)::interval
      ) AS s(bucket)
      LEFT JOIN (
        finance_transaction t
        JOIN finance_label l
          ON l.id = t."labelId"
          AND l.name NOT LIKE 'Transfer to %'
          AND l.name NOT LIKE 'Transfer from %'
      )
        ON t."userId" = ${userId}
        AND date_trunc(${bucket}::text, t."occurredAt" AT TIME ZONE 'Asia/Manila') = s.bucket
      GROUP BY s.bucket
      ORDER BY s.bucket
    `;
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

  createTransfer(userId: string, input: TransferInput) {
    return this.prisma.$transaction(
      async (db) => {
        const wallets = await db.financeWallet.findMany({
          where: {
            userId,
            id: { in: [input.fromWalletId, input.toWalletId] },
          },
          select: { id: true, name: true, openingBalance: true },
        });
        const source = wallets.find(
          (wallet) => wallet.id === input.fromWalletId,
        );
        const destination = wallets.find(
          (wallet) => wallet.id === input.toWalletId,
        );
        if (!source || !destination) {
          return { status: "WALLET_NOT_FOUND" as const };
        }

        const totals = await db.financeTransaction.groupBy({
          by: ["type"],
          where: { userId, walletId: source.id },
          _sum: { amount: true },
        });
        const sourceBalance = totals.reduce((balance, total) => {
          const amount = total._sum.amount ?? new Prisma.Decimal(0);
          return total.type === "INCOME"
            ? balance.plus(amount)
            : balance.minus(amount);
        }, source.openingBalance);
        const amount = new Prisma.Decimal(input.amount);
        if (sourceBalance.lessThan(amount)) {
          return { status: "INSUFFICIENT_FUNDS" as const };
        }

        const outgoingName = `Transfer to ${destination.name}`;
        const incomingName = `Transfer from ${source.name}`;
        const outgoingLabel = await db.financeLabel.upsert({
          where: {
            userId_type_normalizedName: {
              userId,
              type: "EXPENSE",
              normalizedName: outgoingName.toLowerCase(),
            },
          },
          create: {
            userId,
            type: "EXPENSE",
            name: outgoingName,
            normalizedName: outgoingName.toLowerCase(),
          },
          update: {},
        });
        const incomingLabel = await db.financeLabel.upsert({
          where: {
            userId_type_normalizedName: {
              userId,
              type: "INCOME",
              normalizedName: incomingName.toLowerCase(),
            },
          },
          create: {
            userId,
            type: "INCOME",
            name: incomingName,
            normalizedName: incomingName.toLowerCase(),
          },
          update: {},
        });
        const data = {
          userId,
          amount: input.amount,
          notes: input.notes || null,
          occurredAt: new Date(input.occurredAt),
        };
        const outgoing = await db.financeTransaction.create({
          data: {
            ...data,
            walletId: source.id,
            labelId: outgoingLabel.id,
            type: "EXPENSE",
          },
        });
        const incoming = await db.financeTransaction.create({
          data: {
            ...data,
            walletId: destination.id,
            labelId: incomingLabel.id,
            type: "INCOME",
          },
        });
        return {
          status: "CREATED" as const,
          transactionIds: [outgoing.id, incoming.id],
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  deleteTransaction(userId: string, id: string) {
    return this.prisma.financeTransaction.delete({ where: { id, userId } });
  }
}
