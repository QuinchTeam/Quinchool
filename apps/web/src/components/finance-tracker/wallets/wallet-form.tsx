"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveWallet } from "@/hooks/use-finance-tracker/use-wallets";
import { WALLET_COLORS } from "@/lib/finance-tracker/format";
import { walletSchema } from "@/lib/finance-tracker/schema";
import {
  WALLET_TYPES,
  type Wallet,
  type WalletInput,
} from "@/lib/finance-tracker/types";
import { FinanceField } from "../shared/finance-field";

export function WalletForm({
  wallet,
  onSaved,
  onPendingChange,
}: {
  wallet?: Wallet;
  onSaved: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const prefix = useId();
  const save = useSaveWallet();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues: wallet
      ? {
          name: wallet.name,
          type: wallet.type,
          color: wallet.color,
          openingBalance: wallet.openingBalance,
        }
      : {
          name: "",
          type: "CASH",
          color: WALLET_COLORS[0],
          openingBalance: "0.00",
        },
  });

  async function submit(values: WalletInput) {
    onPendingChange(true);
    try {
      await save.mutateAsync({ id: wallet?.id, values });
      toast.success(wallet ? "Wallet updated." : "Wallet added.");
      onSaved();
    } catch {
      // Mutation error stays beside the form; entered values remain intact.
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(submit)} noValidate>
      <fieldset className="grid min-w-0 gap-5" disabled={save.isPending}>
        <FinanceField
          id={`${prefix}-name`}
          label="Name"
          error={errors.name?.message}
        >
          <Input
            id={`${prefix}-name`}
            maxLength={80}
            autoComplete="off"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${prefix}-name-error` : undefined}
            {...register("name")}
          />
        </FinanceField>
        <FinanceField
          id={`${prefix}-type`}
          label="Wallet type"
          error={errors.type?.message}
        >
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
                items={WALLET_TYPES}
              >
                <SelectTrigger
                  id={`${prefix}-type`}
                  className="w-full"
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WALLET_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FinanceField>
        <FinanceField
          id={`${prefix}-balance`}
          label="Opening balance (PHP)"
          error={errors.openingBalance?.message}
        >
          <Input
            id={`${prefix}-balance`}
            inputMode="decimal"
            aria-invalid={!!errors.openingBalance}
            aria-describedby={
              errors.openingBalance ? `${prefix}-balance-error` : undefined
            }
            {...register("openingBalance")}
          />
        </FinanceField>
        <FinanceField
          id={`${prefix}-color`}
          label="Color"
          error={errors.color?.message}
        >
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-wrap items-center gap-2">
                {WALLET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="size-8 rounded-sm border-2 border-transparent outline-offset-2 aria-pressed:border-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                    title={color}
                    aria-pressed={field.value === color}
                    onClick={() => field.onChange(color)}
                  />
                ))}
                <Input
                  id={`${prefix}-color`}
                  type="color"
                  className="h-8 w-12 cursor-pointer p-1"
                  {...field}
                  title="Custom color"
                  aria-label="Custom color"
                />
              </div>
            )}
          />
        </FinanceField>
      </fieldset>
      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving..." : "Save wallet"}
      </Button>
    </form>
  );
}
