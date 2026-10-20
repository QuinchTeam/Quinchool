"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveTransaction } from "@/features/finance-tracker/hooks/use-transactions";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import { toLocalDateTime } from "@/features/finance-tracker/lib/format";
import {
  type TransactionFormValues,
  transactionFormSchema,
} from "@/features/finance-tracker/lib/schema";
import type { Transaction } from "@/features/finance-tracker/lib/types";
import { FinanceField } from "../shared/finance-field";
import { ErrorState } from "@/components/shared/error-state";
import { TransactionSourceFields } from "./transaction-source-fields";

export function TransactionForm({
  transaction,
  walletId,
  onSaved,
  onPendingChange,
}: {
  transaction?: Transaction;
  walletId?: string;
  onSaved: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const prefix = useId();
  const overview = useFinanceOverview();
  const save = useSaveTransaction();
  const wallets = overview.data?.wallets ?? [];
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      walletId: transaction?.wallet.id ?? walletId ?? wallets[0]?.id ?? "",
      type: transaction?.type ?? "EXPENSE",
      amount: transaction?.amount ?? "",
      label: transaction?.label.name ?? "",
      notes: transaction?.notes ?? "",
      occurredAt: toLocalDateTime(transaction?.occurredAt),
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function submit(values: TransactionFormValues) {
    onPendingChange(true);
    try {
      await save.mutateAsync({
        id: transaction?.id,
        values: {
          ...values,
          occurredAt:
            transaction &&
            values.occurredAt === toLocalDateTime(transaction.occurredAt)
              ? transaction.occurredAt
              : new Date(values.occurredAt).toISOString(),
        },
      });
      toast.success(
        transaction ? "Transaction updated." : "Transaction added.",
      );
      onSaved();
    } catch {
      // Preserve entered values and show the mutation error inside the form.
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={handleSubmit(submit)} noValidate>
        {overview.error && (
          <ErrorState
            error={overview.error}
            retry={() => {
              void overview.refetch();
            }}
          />
        )}
        <fieldset className="grid min-w-0 gap-5" disabled={save.isPending}>
          <TransactionSourceFields />
          <FinanceField
            id={`${prefix}-amount`}
            label="Amount (PHP)"
            error={errors.amount?.message}
          >
            <Input
              id={`${prefix}-amount`}
              inputMode="decimal"
              aria-invalid={!!errors.amount}
              aria-describedby={
                errors.amount ? `${prefix}-amount-error` : undefined
              }
              {...register("amount")}
            />
          </FinanceField>
          <FinanceField
            id={`${prefix}-date`}
            label="Date and time"
            error={errors.occurredAt?.message}
          >
            <Input
              id={`${prefix}-date`}
              type="datetime-local"
              max={toLocalDateTime()}
              aria-invalid={!!errors.occurredAt}
              aria-describedby={
                errors.occurredAt ? `${prefix}-date-error` : undefined
              }
              {...register("occurredAt")}
            />
          </FinanceField>
          <FinanceField
            id={`${prefix}-notes`}
            label="Notes (optional)"
            error={errors.notes?.message}
          >
            <Textarea
              id={`${prefix}-notes`}
              rows={3}
              maxLength={1000}
              aria-invalid={!!errors.notes}
              aria-describedby={
                errors.notes ? `${prefix}-notes-error` : undefined
              }
              {...register("notes")}
            />
          </FinanceField>
        </fieldset>
        {save.error && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
        )}
        <Button type="submit" disabled={save.isPending || !wallets.length}>
          {save.isPending ? "Saving..." : "Save transaction"}
        </Button>
      </form>
    </Form>
  );
}
