"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFinanceOverview } from "@/hooks/use-finance-tracker/use-wallets";
import { formatMoney } from "@/lib/finance-tracker/format";
import type { TransactionFormValues } from "@/lib/finance-tracker/schema";
import { FinanceField } from "../shared/finance-field";
import { LabelPicker } from "./label-picker";

export function TransactionSourceFields() {
  const prefix = useId();
  const overview = useFinanceOverview();
  const wallets = overview.data?.wallets ?? [];
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<TransactionFormValues>();
  const type = watch("type");

  return (
    <>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <ToggleGroup
            aria-label="Transaction type"
            value={[field.value]}
            onValueChange={(values) => {
              if (values[0]) field.onChange(values[0]);
            }}
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="EXPENSE" className="flex-1">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="INCOME" className="flex-1">
              Income
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      />
      <FinanceField
        id={`${prefix}-wallet`}
        label="Wallet"
        error={errors.walletId?.message}
      >
        <Controller
          control={control}
          name="walletId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                if (value) field.onChange(value);
              }}
              items={wallets.map((wallet) => ({
                value: wallet.id,
                label: wallet.name,
              }))}
            >
              <SelectTrigger
                id={`${prefix}-wallet`}
                className="w-full"
                ref={field.ref}
                onBlur={field.onBlur}
                aria-invalid={!!errors.walletId}
                aria-describedby={
                  errors.walletId ? `${prefix}-wallet-error` : undefined
                }
              >
                <SelectValue placeholder="Choose wallet" />
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
        id={`${prefix}-label`}
        label={type === "INCOME" ? "Income label" : "Expense label"}
        error={errors.label?.message}
      >
        <Controller
          control={control}
          name="label"
          render={({ field }) => (
            <LabelPicker
              id={`${prefix}-label`}
              type={type}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={!!errors.label}
              describedBy={errors.label ? `${prefix}-label-error` : undefined}
            />
          )}
        />
      </FinanceField>
    </>
  );
}
