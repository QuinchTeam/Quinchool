import { z } from "zod";

const moneySchema = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/,
    "Enter an amount up to 999,999,999,999.99 with at most two decimal places.",
  );

export const walletSchema = z.object({
  name: z.string().trim().min(1, "Enter a wallet name.").max(80),
  type: z.enum(["CASH", "EWALLET", "TRADITIONAL_BANK", "DIGITAL_BANK"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
  openingBalance: moneySchema,
});

export const transactionFormSchema = z.object({
  walletId: z.string().min(1, "Choose a wallet."),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: moneySchema.refine(
    (value) => /[1-9]/.test(value),
    "Amount must be greater than zero.",
  ),
  label: z.string().trim().min(1, "Enter a label.").max(120),
  notes: z.string().trim().max(1000),
  occurredAt: z
    .string()
    .min(1, "Choose a date and time.")
    .refine(
      (value) =>
        Number.isFinite(new Date(value).getTime()) &&
        new Date(value).getTime() <= Date.now(),
      "Choose a valid date and time that is not in the future.",
    ),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
