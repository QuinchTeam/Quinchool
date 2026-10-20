"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/ui/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import type {
  HistoryPeriod,
  TransactionFilters,
  TransactionSort,
} from "@/features/finance-tracker/lib/types";

const TYPES = { ALL: "All types", INCOME: "Income", EXPENSE: "Expense" };
const PERIODS: Record<HistoryPeriod | "ALL", string> = {
  ALL: "All time",
  today: "Today",
  last7: "Last 7 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  thisYear: "This year",
};
const SORTS: Record<TransactionSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  highest: "Highest amount",
  lowest: "Lowest amount",
};

function FilterSelect<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <Select
      value={value}
      items={items}
      onValueChange={(next) => {
        if (next && next in items) onChange(next as T);
      }}
    >
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(items) as [T, string][]).map(([key, text]) => (
          <SelectItem key={key} value={key}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function HistoryFilters({
  filters,
  onChange,
}: {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}) {
  const prefix = useId();
  const overview = useFinanceOverview();
  const wallets: Record<string, string> = { ALL: "All wallets" };
  for (const wallet of overview.data?.wallets ?? []) {
    wallets[wallet.id] = wallet.name;
  }

  const [search, setSearch] = useState(filters.search ?? "");
  useEffect(() => {
    const next = search.trim() || undefined;
    if (next === filters.search) return;
    const timer = setTimeout(() => onChange({ ...filters, search: next }), 300);
    return () => clearTimeout(timer);
  }, [search, filters, onChange]);

  const active =
    Boolean(search) ||
    Object.values({ ...filters, search: undefined }).some(Boolean);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Filter History</CardTitle>
        <CardAction>
          {active && (
            <Button
              variant="ghost"
              size="sm"
              // Use the card color for hover because the surrounding shell is already muted.
              className="hover:bg-card!"
              onClick={() => {
                setSearch("");
                onChange({});
              }}
            >
              <XIcon size={24} />
              Clear filters
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <InputGroup className="sm:col-span-2">
            <InputGroupAddon>
              <AppIcon icon={MagnifyingGlassIcon} />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search transactions"
              placeholder="Search labels or notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
          <FilterSelect
            label="Wallet"
            value={filters.walletId ?? "ALL"}
            items={wallets}
            onChange={(value) =>
              onChange({
                ...filters,
                walletId: value === "ALL" ? undefined : value,
              })
            }
          />
          <FilterSelect
            label="Type"
            value={filters.type ?? "ALL"}
            items={TYPES}
            onChange={(value) =>
              onChange({
                ...filters,
                type: value === "ALL" ? undefined : value,
              })
            }
          />
          <FilterSelect
            label="Period"
            value={filters.period ?? "ALL"}
            items={PERIODS}
            onChange={(value) =>
              onChange({
                ...filters,
                period: value === "ALL" ? undefined : value,
              })
            }
          />
          <FilterSelect
            label="Sort"
            value={filters.sort ?? "newest"}
            items={SORTS}
            onChange={(value) =>
              onChange({
                ...filters,
                sort: value === "newest" ? undefined : value,
              })
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${prefix}-transfers`}
              checked={filters.excludeTransfers ?? false}
              onCheckedChange={(checked) =>
                onChange({ ...filters, excludeTransfers: checked || undefined })
              }
            />
            <Label htmlFor={`${prefix}-transfers`}>
              Hide transfers between wallets
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
