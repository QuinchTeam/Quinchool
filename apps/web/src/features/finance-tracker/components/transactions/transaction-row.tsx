"use client";

import { ArrowDownLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownLeft";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { AppIcon } from "@/components/ui/icon";
import { useDeleteTransaction } from "@/features/finance-tracker/hooks/use-transactions";
import {
  amountClassName,
  formatMoney,
  formatTransactionDate,
} from "@/features/finance-tracker/lib/format";
import type { Transaction } from "@/features/finance-tracker/lib/types";
import { cn } from "@/lib/utils";
import { FinanceDeleteDialog } from "../shared/delete-dialog";
import { TransactionDialog } from "./transaction-dialog";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const remove = useDeleteTransaction();
  const income = transaction.type === "INCOME";
  // Transfers are generated as labeled pairs; show them as moves, not spending.
  const transfer = /^Transfer (to|from) /.test(transaction.label.name);
  return (
    <li className="flex items-center gap-3 border-b py-4 last:border-b-0">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-md",
          transfer
            ? "bg-muted text-muted-foreground"
            : income
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
        )}
      >
        <AppIcon
          icon={
            transfer
              ? ArrowsLeftRightIcon
              : income
                ? ArrowDownLeftIcon
                : ArrowUpRightIcon
          }
          className="size-6"
        />
        <span className="sr-only">
          {transfer ? "Transfer" : income ? "Income" : "Expense"}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.label.name}</p>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-sm"
            style={{ backgroundColor: transaction.wallet.color }}
          />
          <span className="shrink-0">{transaction.wallet.name}</span>
          {transaction.notes && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate" title={transaction.notes}>
                {transaction.notes}
              </span>
            </>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-base font-semibold tabular-nums",
            amountClassName(transaction.type),
          )}
        >
          {income ? "+" : "-"}
          {formatMoney(transaction.amount)}
        </p>
        <time
          dateTime={transaction.occurredAt}
          className="mt-1 block text-xs text-muted-foreground"
        >
          {formatTransactionDate(transaction.occurredAt)}
        </time>
      </div>
      <div className="flex shrink-0 items-center">
        <TransactionDialog transaction={transaction} />
        <FinanceDeleteDialog
          title={`Delete ${transaction.label.name}`}
          description={`Delete this ${income ? "income" : "expense"} of ${formatMoney(transaction.amount)}? The balance in ${transaction.wallet.name} will be recalculated.`}
          onDelete={() => remove.mutateAsync(transaction.id)}
        />
      </div>
    </li>
  );
}
