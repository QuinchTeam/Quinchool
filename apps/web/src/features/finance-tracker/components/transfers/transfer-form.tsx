"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/shared/date-time-picker";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTransfer } from "@/features/finance-tracker/hooks/use-transactions";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import { toLocalDateTime } from "@/features/finance-tracker/lib/format";
import {
  type TransferFormValues,
  transferFormSchema,
} from "@/features/finance-tracker/lib/schema";
import { FinanceField } from "../shared/finance-field";
import { WalletSelect } from "./wallet-select";

export function TransferForm({
  onSaved,
  onPendingChange,
}: {
  onSaved: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const prefix = useId();
  const wallets = useFinanceOverview().data?.wallets ?? [];
  const transfer = useCreateTransfer();
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromWalletId: wallets[0]?.id ?? "",
      toWalletId: wallets[1]?.id ?? "",
      amount: "",
      notes: "",
      occurredAt: toLocalDateTime(),
    },
  });
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const fromWalletId = watch("fromWalletId");
  const destinationWallets = wallets.filter(
    (wallet) => wallet.id !== fromWalletId,
  );

  async function submit(values: TransferFormValues) {
    onPendingChange(true);
    try {
      await transfer.mutateAsync({
        ...values,
        occurredAt: new Date(values.occurredAt).toISOString(),
      });
      toast.success("Money transferred.");
      onSaved();
    } catch {
      // Preserve entered values and show the mutation error inside the dialog.
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-5" onSubmit={handleSubmit(submit)} noValidate>
        <fieldset className="grid min-w-0 gap-5" disabled={transfer.isPending}>
          <FinanceField
            id={`${prefix}-from-wallet`}
            label="From wallet"
            error={errors.fromWalletId?.message}
          >
            <Controller
              control={control}
              name="fromWalletId"
              render={({ field }) => (
                <WalletSelect
                  id={`${prefix}-from-wallet`}
                  invalid={!!errors.fromWalletId}
                  placeholder="Choose source wallet"
                  ref={field.ref}
                  value={field.value}
                  wallets={wallets}
                  onBlur={field.onBlur}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (getValues("toWalletId") === value) {
                      setValue(
                        "toWalletId",
                        wallets.find((wallet) => wallet.id !== value)?.id ?? "",
                        { shouldValidate: true },
                      );
                    }
                  }}
                />
              )}
            />
          </FinanceField>
          <FinanceField
            id={`${prefix}-to-wallet`}
            label="To wallet"
            error={errors.toWalletId?.message}
          >
            <Controller
              control={control}
              name="toWalletId"
              render={({ field }) => (
                <WalletSelect
                  id={`${prefix}-to-wallet`}
                  invalid={!!errors.toWalletId}
                  placeholder="Choose destination wallet"
                  ref={field.ref}
                  value={field.value}
                  wallets={destinationWallets}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                />
              )}
            />
          </FinanceField>
          <FinanceField
            id={`${prefix}-amount`}
            label="Amount (₱)"
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
            <Controller
              control={control}
              name="occurredAt"
              render={({ field }) => (
                <DateTimePicker
                  id={`${prefix}-date`}
                  value={field.value}
                  onChange={field.onChange}
                  max={new Date()}
                  invalid={!!errors.occurredAt}
                  describedBy={
                    errors.occurredAt ? `${prefix}-date-error` : undefined
                  }
                />
              )}
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
        {transfer.error && (
          <p role="alert" className="text-sm text-destructive">
            {transfer.error.message}
          </p>
        )}
        <Button
          type="submit"
          loading={transfer.isPending}
          loadingText="Transferring..."
        >
          Transfer money
        </Button>
      </form>
    </Form>
  );
}
