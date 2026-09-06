"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { runToolAction, sendChatMessage } from "@/lib/chatbot/api";
import type { DisplayMessage, PendingToolAction } from "@/lib/chatbot/types";

export function useChatbot() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const reply = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (result) => appendAssistant(result),
  });

  const action = useMutation({
    mutationFn: runToolAction,
    onSuccess: (reply, { action: confirmed }) => {
      retireAction(confirmed, "done");
      appendAssistant(reply);
    },
  });

  function appendAssistant({
    pendingAction,
    text,
    toolUsed,
  }: {
    pendingAction?: PendingToolAction;
    text: string;
    toolUsed?: boolean;
  }) {
    if (!text && !pendingAction) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        content: text,
        id: crypto.randomUUID(),
        pendingAction,
        role: "assistant",
        toolUsed,
      },
    ]);
  }

  function retireAction(
    confirmed: PendingToolAction,
    outcome: "done" | "dismissed",
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.pendingAction?.tool === confirmed.tool &&
        message.actionOutcome === undefined
          ? { ...message, actionOutcome: outcome }
          : message,
      ),
    );
  }

  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    if (lastMessageId || reply.isPending) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, reply.isPending]);

  function sendMessage(content: string) {
    const trimmed = content.trim();

    if (!trimmed || reply.isPending) {
      return;
    }

    const nextMessages: DisplayMessage[] = [
      ...messages,
      { content: trimmed, id: crypto.randomUUID(), role: "user" },
    ];

    setMessages(nextMessages);
    setInput("");
    reply.mutate({ messages: nextMessages, modelId });
  }

  function startNewChat() {
    setMessages([]);
    setInput("");
    reply.reset();
    action.reset();
  }

  return {
    action: {
      dismiss: (confirmed: PendingToolAction) =>
        retireAction(confirmed, "dismissed"),
      error: action.error?.message ?? "",
      isPending: action.isPending,
      submit: (confirmed: PendingToolAction, values: Record<string, unknown>) =>
        action.mutate({ action: confirmed, messages, modelId, values }),
    },
    endRef,
    error: reply.error?.message ?? "",
    input,
    isPending: reply.isPending,
    messages,
    modelId,
    sendMessage,
    setInput,
    setModelId,
    startNewChat,
  };
}

export type ChatbotActions = ReturnType<typeof useChatbot>["action"];
