"use client";

import { ArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
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
import { TransferForm } from "./transfer-form";

export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const wallets = useFinanceOverview().data?.wallets ?? [];
  const disabled = wallets.length < 2;

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
            variant="secondary"
            disabled={disabled}
            title={
              disabled
                ? "Add at least two wallets to transfer money."
                : undefined
            }
          />
        }
      >
        <AppIcon icon={ArrowsLeftRightIcon} />
        Transfer
      </DialogTrigger>
      <DialogContent
        className="max-h-finance-dialog overflow-y-auto"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
        </DialogHeader>
        {open && (
          <TransferForm
            onSaved={() => setOpen(false)}
            onPendingChange={setPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
