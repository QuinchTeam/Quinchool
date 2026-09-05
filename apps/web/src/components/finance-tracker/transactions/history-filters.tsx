"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceOverview } from "@/hooks/use-finance-tracker/use-wallets";
import type { TransactionFilters } from "@/lib/finance-tracker/types";

const TRANSACTION_TYPES = {
  ALL: "All types",
  INCOME: "Income",
  EXPENSE: "Expense",
};

export function HistoryFilters({
  filters,
  onChange,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}) {
  const prefix = useId();
  const overview = useFinanceOverview();
  const wallets = [
    { value: "ALL", label: "All wallets" },
    ...(overview.data?.wallets ?? []).map((wallet) => ({
      value: wallet.id,
      label: wallet.name,
    })),
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${prefix}-wallet`}>Wallet</Label>
        <Select
          value={filters.walletId ?? "ALL"}
          items={wallets}
          onValueChange={(value) => {
            if (value)
              onChange({
                ...filters,
                walletId: value === "ALL" ? undefined : value,
              });
          }}
        >
          <SelectTrigger id={`${prefix}-wallet`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((wallet) => (
              <SelectItem key={wallet.value} value={wallet.value}>
                {wallet.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${prefix}-type`}>Type</Label>
        <Select
          value={filters.type ?? "ALL"}
          items={TRANSACTION_TYPES}
          onValueChange={(value) => {
            if (value === "ALL" || value === "INCOME" || value === "EXPENSE")
              onChange({
                ...filters,
                type: value === "ALL" ? undefined : value,
              });
          }}
        >
          <SelectTrigger id={`${prefix}-type`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRANSACTION_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
