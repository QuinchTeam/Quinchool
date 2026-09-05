"use client";

import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDeleteTransaction } from "@/hooks/use-finance-tracker/use-transactions";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/finance-tracker/format";
import type { Transaction } from "@/lib/finance-tracker/types";
import { cn } from "@/lib/utils";
import { FinanceDeleteDialog } from "../shared/delete-dialog";
import { TransactionDialog } from "./transaction-dialog";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const remove = useDeleteTransaction();
  const income = transaction.type === "INCOME";
  return (
    <li className="flex flex-wrap items-center gap-3 border-b py-4 last:border-b-0 sm:flex-nowrap">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-sm",
          income
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
        )}
      >
        <HugeiconsIcon
          icon={income ? ArrowDownLeft01Icon : ArrowUpRight01Icon}
          strokeWidth={2}
          className="size-4"
        />
        <span className="sr-only">{income ? "Income" : "Expense"}</span>
      </span>
      <div className="min-w-0 flex-1 basis-1/2">
        <p className="break-words text-sm font-medium">
          {transaction.label.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: transaction.wallet.color }}
            />
            {transaction.wallet.name}
          </span>
          <time dateTime={transaction.occurredAt}>
            {formatTransactionDate(transaction.occurredAt)}
          </time>
        </div>
        {transaction.notes && (
          <p
            className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground"
            title={transaction.notes}
          >
            {transaction.notes}
          </p>
        )}
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
        <p
          className={cn(
            "break-all text-sm font-semibold tabular-nums",
            income
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground",
          )}
        >
          {income ? "+" : "-"}
          {formatMoney(transaction.amount)}
        </p>
        <div className="flex shrink-0 items-center">
          <TransactionDialog transaction={transaction} />
          <FinanceDeleteDialog
            title={`Delete ${transaction.label.name}`}
            description={`Delete this ${income ? "income" : "expense"} of ${formatMoney(transaction.amount)}? The balance in ${transaction.wallet.name} will be recalculated.`}
            onDelete={() => remove.mutateAsync(transaction.id)}
          />
        </div>
      </div>
    </li>
  );
}
