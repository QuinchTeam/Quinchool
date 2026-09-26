"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export function ChatComposer({
  isPending,
  onChange,
  onSend,
  value,
}: {
  isPending: boolean;
  onChange: (value: string) => void;
  onSend: (content: string) => void;
  value: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      onSend(value);
    }
  }

  return (
    <footer className="border-t bg-background px-6 py-4">
      <form
        className="w-full"
        onSubmit={handleSubmit}
        aria-label="Chat message"
      >
        <InputGroup className="min-h-24 items-end bg-background">
          <InputGroupTextarea
            aria-label="Message"
            autoFocus
            className="max-h-48 min-h-16"
            disabled={isPending}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Quinch Bot"
            value={value}
          />
          <InputGroupAddon align="block-end" className="justify-end">
            <InputGroupButton
              aria-label="Send message"
              disabled={!value.trim() || isPending}
              size="icon-sm"
              type="submit"
              variant="default"
            >
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </footer>
  );
}
