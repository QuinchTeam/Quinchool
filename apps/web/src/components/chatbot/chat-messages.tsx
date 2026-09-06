"use client";

import type { RefObject } from "react";

import { ChatAvatar, ChatMessage } from "@/components/chatbot/chat-message";
import type { ChatbotActions } from "@/hooks/use-chatbot";
import type { DisplayMessage } from "@/lib/chatbot/types";

export function ChatMessages({
  action,
  endRef,
  error,
  isPending,
  messages,
}: {
  action: ChatbotActions;
  endRef: RefObject<HTMLDivElement | null>;
  error: string;
  isPending: boolean;
  messages: DisplayMessage[];
}) {
  return (
    <div className="grid w-full gap-8 px-6 py-8">
      {messages.map((message) => (
        <ChatMessage key={message.id} action={action} message={message} />
      ))}
      {isPending ? (
        <div className="flex gap-3" aria-live="polite">
          <ChatAvatar />
          <p className="pt-2 text-sm text-muted-foreground animate-pulse">
            Thinking...
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
