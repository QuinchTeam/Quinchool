import { z } from "zod";

export const financeIdSchema = z.string().cuid();
export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE"]);
const moneySchema = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/,
    "Enter an amount up to 999,999,999,999.99 with at most two decimal places.",
  );

export const walletSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["CASH", "EWALLET", "TRADITIONAL_BANK", "DIGITAL_BANK"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid wallet color."),
  openingBalance: moneySchema,
});

export const walletOrderSchema = z.strictObject({
  ids: z
    .array(financeIdSchema)
    .min(1)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Wallet order must not contain duplicates.",
    ),
});

export const transactionSchema = z.strictObject({
  walletId: financeIdSchema,
  type: transactionTypeSchema,
  amount: moneySchema.refine(
    (value) => /[1-9]/.test(value),
    "Amount must be greater than zero.",
  ),
  label: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).default(""),
  occurredAt: z.iso
    .datetime({ offset: true })
    .refine(
      (value) => new Date(value).getTime() <= Date.now(),
      "Transaction date cannot be in the future.",
    ),
});

export const transferSchema = z
  .strictObject({
    fromWalletId: financeIdSchema,
    toWalletId: financeIdSchema,
    amount: moneySchema.refine(
      (value) => /[1-9]/.test(value),
      "Amount must be greater than zero.",
    ),
    notes: z.string().trim().max(1000).default(""),
    occurredAt: z.iso
      .datetime({ offset: true })
      .refine(
        (value) => new Date(value).getTime() <= Date.now(),
        "Transfer date cannot be in the future.",
      ),
  })
  .refine((input) => input.fromWalletId !== input.toWalletId, {
    message: "Choose two different wallets.",
    path: ["toWalletId"],
  });

export const transactionQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  walletId: financeIdSchema.optional(),
  type: transactionTypeSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  excludeTransfers: z.stringbool().default(false),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export const summaryQuerySchema = z.strictObject({
  period: z.enum(["day", "week", "month", "year"]).default("month"),
});

export const labelQuerySchema = z.strictObject({
  type: transactionTypeSchema,
  search: z.string().trim().max(120).default(""),
});

export type WalletInput = z.infer<typeof walletSchema>;
export type WalletOrder = z.infer<typeof walletOrderSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type LabelQuery = z.infer<typeof labelQuerySchema>;
