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
import { useChatbotStore } from "@/features/chatbot/store/chatbot-store";

export function ChatComposer({
  isPending,
  onSend,
}: {
  isPending: boolean;
  onSend: (content: string) => void;
}) {
  const value = useChatbotStore((state) => state.input);
  const onChange = useChatbotStore((state) => state.setInput);

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
    <footer className="border-t px-4 py-4 md:px-6">
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
              disabled={!value.trim()}
              loading={isPending}
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
