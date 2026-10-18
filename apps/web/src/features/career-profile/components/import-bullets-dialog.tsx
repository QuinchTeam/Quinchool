"use client";

import { ClipboardTextIcon } from "@phosphor-icons/react/dist/ssr/ClipboardText";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppIcon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { parsePastedBullets } from "@/features/career-profile/lib/normalize-pasted-text";

export function ImportBulletsDialog({
  onImport,
}: {
  onImport: (bullets: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const bullets = parsePastedBullets(text);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        <AppIcon icon={ClipboardTextIcon} />
        Import Experiences
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Experiences</DialogTitle>
          <DialogDescription>
            Paste bullets from your resume. Each • or - starts a new bullet;
            wrapped lines are joined.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          aria-label="Bullets to import"
          className="min-h-64"
          placeholder={
            "• Shipped a feature that cut checkout time by 30%.\n• Led a team of 4 engineers."
          }
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            disabled={!bullets.length}
            onClick={() => {
              onImport(bullets);
              setOpen(false);
              setText("");
            }}
          >
            Import {bullets.length || ""}{" "}
            {bullets.length === 1 ? "bullet" : "bullets"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
