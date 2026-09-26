"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FinanceDeleteDialog({
  title,
  description,
  onDelete,
}: {
  title: string;
  description: string;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    try {
      await onDelete();
      setOpen(false);
      toast.success("Deleted.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Delete failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) {
          setOpen(value);
          setError("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            title={title}
            aria-label={title}
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </DialogTrigger>
      <DialogContent className="rounded-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle className="break-words pr-6">{title}</DialogTitle>
          <DialogDescription className="break-words">
            {description}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" disabled={pending} onClick={remove}>
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
