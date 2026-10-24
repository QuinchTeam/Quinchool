"use client";

import type { Ref } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/features/finance-tracker/lib/format";
import type { Wallet } from "@/features/finance-tracker/lib/types";

export function WalletSelect({
  id,
  invalid,
  onBlur,
  onValueChange,
  placeholder,
  ref,
  value,
  wallets,
}: {
  id: string;
  invalid: boolean;
  onBlur: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  ref: Ref<HTMLButtonElement>;
  value: string;
  wallets: Wallet[];
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      items={wallets.map((wallet) => ({
        value: wallet.id,
        label: wallet.name,
      }))}
    >
      <SelectTrigger
        id={id}
        className="w-full"
        ref={ref}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      >
        <SelectValue placeholder={placeholder} />
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
  );
}
