import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AppIcon } from "@/components/ui/icon";
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
      // Laid over an invisible skeleton so empty, loading and five-row states share one height.
      <div className="relative">
        <div aria-hidden className="invisible">
          <TransactionsLoading />
        </div>
        <Empty className="absolute inset-0 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppIcon icon={ReceiptIcon} />
            </EmptyMedia>
            <EmptyTitle>No Transactions Yet</EmptyTitle>
            <EmptyDescription>
              Record income or an expense to start tracking where your money
              goes.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <TransactionDialog />
          </EmptyContent>
        </Empty>
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
