import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/lib/finance-tracker/types";
import { TransactionRow } from "./transaction-row";

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (!transactions.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No transactions yet.
      </p>
    );
  }
  return (
    <ul aria-label="Transactions" className="min-w-0">
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </ul>
  );
}

export function TransactionsLoading() {
  return (
    <div
      className="grid gap-3 py-4"
      role="status"
      aria-label="Loading transactions"
    >
      {[1, 2, 3].map((row) => (
        <Skeleton key={row} className="h-16 w-full rounded-sm" />
      ))}
    </div>
  );
}
