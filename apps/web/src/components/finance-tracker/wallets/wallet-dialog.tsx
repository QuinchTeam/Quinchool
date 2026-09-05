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
import type { Wallet } from "@/lib/finance-tracker/types";
import { WalletForm } from "./wallet-form";

export function WalletDialog({ wallet }: { wallet?: Wallet }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const title = wallet ? `Edit ${wallet.name}` : "Add wallet";

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
            variant={wallet ? "ghost" : "outline"}
            size={wallet ? "icon-sm" : "default"}
            title={title}
            aria-label={title}
          />
        }
      >
        <HugeiconsIcon icon={wallet ? Edit02Icon : Add01Icon} strokeWidth={2} />
        {!wallet && "Add wallet"}
      </DialogTrigger>
      <DialogContent
        className="max-h-finance-dialog overflow-y-auto rounded-md"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>{wallet ? "Edit wallet" : "Add wallet"}</DialogTitle>
        </DialogHeader>
        {open && (
          <WalletForm
            wallet={wallet}
            onSaved={() => setOpen(false)}
            onPendingChange={setPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
