"use client";

import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFinanceOverview } from "@/hooks/use-finance-tracker/use-wallets";
import type { Transaction } from "@/lib/finance-tracker/types";
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
        <HugeiconsIcon
          icon={transaction ? Edit02Icon : Add01Icon}
          strokeWidth={2}
        />
        {!compact && "Add transaction"}
      </DialogTrigger>
      <DialogContent
        className="max-h-finance-dialog overflow-y-auto rounded-md"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
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
