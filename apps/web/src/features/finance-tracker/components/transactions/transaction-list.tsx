import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { EmptyState } from "@/components/shared/empty-state";
import type { Transaction } from "@/features/finance-tracker/lib/types";
import { TransactionsLoading } from "../shared/finance-loading";
import { TransactionDialog } from "./transaction-dialog";
import { TransactionRow } from "./transaction-row";

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  if (!transactions.length) {
    return (
      // The invisible skeleton keeps empty, loading, and populated states the same height.
      <div className="relative">
        <div aria-hidden className="invisible">
          <TransactionsLoading />
        </div>
        <div className="absolute inset-0">
          <EmptyState
            icon={ReceiptIcon}
            title="No Transactions Yet"
            description="Record income or an expense to start tracking where your money goes."
            action={<TransactionDialog />}
          />
        </div>
      </div>
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
