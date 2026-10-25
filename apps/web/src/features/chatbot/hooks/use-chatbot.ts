"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CHATS_KEY } from "@/features/chatbot/hooks/use-chats";
import { useChatbotStore } from "@/features/chatbot/store/chatbot-store";
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
  const modelId = useChatbotStore((state) => state.modelId);
  const setInput = useChatbotStore((state) => state.setInput);
  const [optimistic, setOptimistic] = useState<DisplayMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const scrolledChatId = useRef<string | undefined | null>(null);

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
    if (!chatId) {
      // Keep the optimistic bubble and prefetch the new chat, so neither page flashes empty while navigating.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CHATS_KEY }),
        queryClient.prefetchQuery({
          queryKey: ["chat", turn.chatId],
          queryFn: () => getChat(turn.chatId),
        }),
      ]);
      router.push(`/chatbot/${turn.chatId}`);
      return;
    }

    setOptimistic([]);

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
      // scrollIntoView also scrolls outer containers, shoving the whole layout up; scroll only the list.
      const list = endRef.current?.closest("main");
      // Jump instantly on the first scroll for each chat (visiting); animate only new messages.
      const isFirst = scrolledChatId.current !== chatId;
      scrolledChatId.current = chatId;
      list?.scrollTo({
        top: list.scrollHeight,
        behavior: isFirst ? "instant" : "smooth",
      });
    }
  }, [chatId, lastMessageId, reply.isPending]);

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
    isLoading: chat.isLoading,
    isPending: reply.isPending || action.isPending,
    messages,
    retry: () => reply.variables && sendMessage(reply.variables.content),
    sendMessage,
    title: chat.data?.title ?? null,
  };
}

export type ChatbotActions = ReturnType<typeof useChatbot>["action"];
export type { PendingToolAction };
