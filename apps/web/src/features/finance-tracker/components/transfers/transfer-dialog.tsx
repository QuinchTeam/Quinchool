"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
import { AppIcon } from "@/components/ui/icon";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTransfer } from "@/features/finance-tracker/hooks/use-transactions";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import {
  formatMoney,
  toLocalDateTime,
} from "@/features/finance-tracker/lib/format";
import {
  type TransferFormValues,
  transferFormSchema,
} from "@/features/finance-tracker/lib/schema";
import { FinanceField } from "../shared/finance-field";

export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const wallets = useFinanceOverview().data?.wallets ?? [];
  const disabled = wallets.length < 2;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            disabled={disabled}
            title={
              disabled
                ? "Add at least two wallets to transfer money."
                : undefined
            }
          />
        }
      >
        <AppIcon icon={ArrowsLeftRightIcon} />
        Transfer
      </DialogTrigger>
      <DialogContent
        className="max-h-finance-dialog overflow-y-auto"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
        </DialogHeader>
        {open && (
          <TransferForm
            onSaved={() => setOpen(false)}
            onPendingChange={setPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransferForm({
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
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (!value) return;
                    field.onChange(value);
                    if (getValues("toWalletId") === value) {
                      setValue(
                        "toWalletId",
                        wallets.find((wallet) => wallet.id !== value)?.id ?? "",
                        { shouldValidate: true },
                      );
                    }
                  }}
                  items={wallets.map((wallet) => ({
                    value: wallet.id,
                    label: wallet.name,
                  }))}
                >
                  <SelectTrigger
                    id={`${prefix}-from-wallet`}
                    className="w-full"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.fromWalletId}
                    aria-describedby={
                      errors.fromWalletId
                        ? `${prefix}-from-wallet-error`
                        : undefined
                    }
                  >
                    <SelectValue placeholder="Choose source wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <span className="truncate">{wallet.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMoney(wallet.balance)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value);
                  }}
                  items={destinationWallets.map((wallet) => ({
                    value: wallet.id,
                    label: wallet.name,
                  }))}
                >
                  <SelectTrigger
                    id={`${prefix}-to-wallet`}
                    className="w-full"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.toWalletId}
                    aria-describedby={
                      errors.toWalletId
                        ? `${prefix}-to-wallet-error`
                        : undefined
                    }
                  >
                    <SelectValue placeholder="Choose destination wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <span className="truncate">{wallet.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMoney(wallet.balance)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FinanceField>
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
        {transfer.error && (
          <p role="alert" className="text-sm text-destructive">
            {transfer.error.message}
          </p>
        )}
        <Button type="submit" disabled={transfer.isPending}>
          {transfer.isPending ? "Transferring..." : "Transfer money"}
        </Button>
      </form>
    </Form>
  );
}
