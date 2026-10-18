"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BankIcon } from "@phosphor-icons/react/dist/ssr/Bank";
import { DotsSixVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsSixVertical";
import { MoneyIcon } from "@phosphor-icons/react/dist/ssr/Money";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { AppIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useDeleteWallet } from "@/features/finance-tracker/hooks/use-wallets";
import { formatMoney } from "@/features/finance-tracker/lib/format";
import {
  WALLET_TYPES,
  type Wallet,
} from "@/features/finance-tracker/lib/types";
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
    active,
  } = useSortable({ id: wallet.id, disabled });
  const icon =
    wallet.type === "CASH"
      ? MoneyIcon
      : wallet.type === "EWALLET"
        ? WalletIcon
        : BankIcon;

  const side = isDragging
    ? wallet.color
    : `color-mix(in srgb, ${wallet.color} 25%, transparent)`;

  return (
    <article
      ref={setNodeRef}
      // "lock" also freezes vertical scroll: the lifted card scales past the grid.
      data-dragging={isDragging ? "lock" : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-md border border-t-4 bg-card p-4 transition-opacity",
        // Lift the picked-up card; `scale`/`rotate` compose with dnd-kit's inline transform.
        isDragging &&
          "relative z-10 -rotate-1 scale-105 cursor-grabbing shadow-2xl",
        // Fade the rest so the moving card and its landing spot stand out.
        active && !isDragging && "opacity-60",
      )}
      style={
        {
          transform: CSS.Transform.toString(transform),
          transition,
          "--wallet-color": wallet.color,
          borderTopColor: wallet.color,
          // Sides use the wallet color at 25%, full strength while lifted. Longhands
          // only: React warns when a `borderColor` shorthand mixes with `borderTopColor`.
          borderRightColor: side,
          borderBottomColor: side,
          borderLeftColor: side,
          backgroundColor: `color-mix(in srgb, ${wallet.color} 8%, var(--card))`,
        } as React.CSSProperties
      }
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-md"
          style={{
            color: wallet.color,
            backgroundColor: `color-mix(in srgb, ${wallet.color} 15%, transparent)`,
          }}
        >
          <AppIcon icon={icon} className="size-6" />
        </span>
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
          className="shrink-0 cursor-grab touch-none hover:bg-wallet-tint! active:bg-wallet-tint! active:cursor-grabbing"
          style={{
            color: `color-mix(in srgb, ${wallet.color} 60%, var(--foreground))`,
          }}
          {...attributes}
          {...listeners}
          title={`Reorder ${wallet.name}`}
          aria-label={`Reorder ${wallet.name}`}
        >
          <AppIcon icon={DotsSixVerticalIcon} className="size-5" />
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
        <div className="flex items-center [&_button]:hover:bg-wallet-tint! [&_button]:active:bg-wallet-tint! [&_button]:aria-expanded:bg-wallet-tint! [&_button]:data-popup-open:bg-wallet-tint!">
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
