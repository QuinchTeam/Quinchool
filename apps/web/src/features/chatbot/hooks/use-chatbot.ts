"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CHATS_KEY } from "@/features/chatbot/hooks/use-chats";
import { DEFAULT_TEXT_GENERATION_MODEL_ID } from "@/lib/ai/text-generation/models";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import {
  dismissToolAction,
  getChat,
  runToolAction,
  sendChatMessage,
} from "@/features/chatbot/lib/api";
import type {
  ChatTurn,
  DisplayMessage,
  PendingToolAction,
} from "@/features/chatbot/lib/types";

// Keep only optimistic state here; persisted history comes from the server.
export function useChatbot(chatId?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modelId, setModelId] = useState<TextGenerationModelId>(
    DEFAULT_TEXT_GENERATION_MODEL_ID,
  );
  const [input, setInput] = useState("");
  const [optimistic, setOptimistic] = useState<DisplayMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChat(chatId as string),
    enabled: Boolean(chatId),
  });

  // Show the optimistic bubble until server history includes the reply.
  const messages: DisplayMessage[] = [
    ...(chat.data?.messages ?? []),
    ...optimistic,
  ];

  async function settle(turn: ChatTurn) {
    setOptimistic([]);

    if (!chatId) {
      // Refresh the list before navigating so the generated title appears in the sidebar.
      await queryClient.invalidateQueries({ queryKey: CHATS_KEY });
      router.push(`/chatbot/${turn.chatId}`);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["chat", turn.chatId] }),
      queryClient.invalidateQueries({ queryKey: CHATS_KEY }),
    ]);
  }

  const reply = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: settle,
    onError: () => setOptimistic([]),
  });

  const action = useMutation({
    mutationFn: runToolAction,
    onSuccess: settle,
  });

  const dismiss = useMutation({
    mutationFn: dismissToolAction,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] }),
  });

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

    setOptimistic([
      {
        content: trimmed,
        id: crypto.randomUUID(),
        pending: true,
        role: "user",
      },
    ]);
    setInput("");
    reply.mutate({ chatId, content: trimmed, modelId });
  }

  return {
    action: {
      dismiss: (message: DisplayMessage) =>
        chatId && dismiss.mutate({ chatId, messageId: message.id }),
      error: action.error?.message ?? "",
      isPending: action.isPending,
      submit: (message: DisplayMessage, values: Record<string, unknown>) =>
        message.pendingAction &&
        chatId &&
        action.mutate({
          action: message.pendingAction,
          chatId,
          messageId: message.id,
          modelId,
          values,
        }),
    },
    endRef,
    error: reply.error?.message ?? "",
    input,
    isLoading: chat.isLoading,
    isPending: reply.isPending || action.isPending,
    messages,
    modelId,
    sendMessage,
    setInput,
    setModelId,
    title: chat.data?.title ?? null,
  };
}

export type ChatbotActions = ReturnType<typeof useChatbot>["action"];
export type { PendingToolAction };
