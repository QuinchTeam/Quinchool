"use client";

import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { AppIcon } from "@/components/ui/icon";
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
    <footer className="border-t px-6 py-4">
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
              <AppIcon icon={PaperPlaneTiltIcon} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </footer>
  );
}
