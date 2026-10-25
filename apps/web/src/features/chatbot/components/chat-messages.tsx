"use client";

import type { RefObject } from "react";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";

import { Button } from "@/components/ui/button";
import {
  ChatAvatar,
  ChatMessage,
} from "@/features/chatbot/components/chat-message";
import { ChatThinking } from "@/features/chatbot/components/chat-thinking";
import type { ChatbotActions } from "@/features/chatbot/hooks/use-chatbot";
import type { DisplayMessage } from "@/features/chatbot/lib/types";

export function ChatMessages({
  action,
  endRef,
  error,
  isPending,
  messages,
  onRetry,
}: {
  onRetry: () => void;
  action: ChatbotActions;
  endRef: RefObject<HTMLDivElement | null>;
  error: string;
  isPending: boolean;
  messages: DisplayMessage[];
}) {
  return (
    <div className="grid w-full gap-8 px-4 py-8 md:px-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} action={action} message={message} />
      ))}
      {isPending ? <ChatThinking /> : null}
      {error ? (
        <div className="flex items-center gap-3" role="alert">
          <ChatAvatar />
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" size="xs" variant="outline" onClick={onRetry}>
            <ArrowClockwiseIcon weight="regular" />
            Retry
          </Button>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
