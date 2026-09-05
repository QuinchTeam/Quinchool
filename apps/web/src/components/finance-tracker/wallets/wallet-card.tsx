"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BankIcon,
  DragDropVerticalIcon,
  Money01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { useDeleteWallet } from "@/hooks/use-finance-tracker/use-wallets";
import { formatMoney } from "@/lib/finance-tracker/format";
import { WALLET_TYPES, type Wallet } from "@/lib/finance-tracker/types";
import { cn } from "@/lib/utils";
import { FinanceDeleteDialog } from "../shared/delete-dialog";
import { TransactionDialog } from "../transactions/transaction-dialog";
import { WalletDialog } from "./wallet-dialog";

export function WalletCard({
  wallet,
  disabled,
}: {
  wallet: Wallet;
  disabled: boolean;
}) {
  const remove = useDeleteWallet();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: wallet.id, disabled });
  const icon =
    wallet.type === "CASH"
      ? Money01Icon
      : wallet.type === "EWALLET"
        ? Wallet01Icon
        : BankIcon;

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-md border border-t-4 bg-card p-4",
        isDragging && "relative z-10 shadow-lg",
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderTopColor: wallet.color,
        backgroundColor: `color-mix(in srgb, ${wallet.color} 8%, var(--card))`,
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="mt-0.5 size-5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold">{wallet.name}</h3>
          <p className="text-xs text-muted-foreground">
            {WALLET_TYPES[wallet.type]}
          </p>
        </div>
        <Button
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
          title={`Reorder ${wallet.name}`}
          aria-label={`Reorder ${wallet.name}`}
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} strokeWidth={2} />
        </Button>
      </div>
      <p className="break-all text-xl font-semibold tabular-nums">
        {formatMoney(wallet.balance)}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {wallet.transactionCount}{" "}
          {wallet.transactionCount === 1 ? "transaction" : "transactions"}
        </span>
        <div className="flex items-center">
          <TransactionDialog walletId={wallet.id} />
          <WalletDialog wallet={wallet} />
          <FinanceDeleteDialog
            title={`Delete ${wallet.name}`}
            description={
              wallet.transactionCount
                ? "This wallet has transaction history. Move or delete its transactions before deleting it."
                : `Delete this wallet and its opening balance of ${formatMoney(wallet.openingBalance)}?`
            }
            onDelete={() => remove.mutateAsync(wallet.id)}
          />
        </div>
      </div>
    </article>
  );
}
