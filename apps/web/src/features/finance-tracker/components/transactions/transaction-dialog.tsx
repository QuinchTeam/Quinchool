"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { AppIcon } from "@/components/ui/icon";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFinanceOverview } from "@/features/finance-tracker/hooks/use-wallets";
import type { Transaction } from "@/features/finance-tracker/lib/types";
import { TransactionForm } from "./transaction-form";

export function TransactionDialog({
  transaction,
  walletId,
}: {
  transaction?: Transaction;
  walletId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const overview = useFinanceOverview();
  const compact = !!transaction || !!walletId;
  const title = transaction
    ? `Edit ${transaction.label.name}`
    : "Add transaction";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) setOpen(value);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={compact ? "ghost" : "default"}
            size={compact ? "icon-sm" : "default"}
            disabled={!overview.data?.wallets.length}
            title={title}
            aria-label={title}
          />
        }
      >
        <AppIcon icon={transaction ? PencilSimpleIcon : PlusCircleIcon} />
        {!compact && "Add transaction"}
      </DialogTrigger>
      <DialogContent
        className="max-h-finance-dialog overflow-y-auto"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <TransactionForm
            transaction={transaction}
            walletId={walletId}
            onSaved={() => setOpen(false)}
            onPendingChange={setPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
