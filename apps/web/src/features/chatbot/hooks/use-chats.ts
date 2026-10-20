"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteChat, listChats, renameChat } from "@/features/chatbot/lib/api";

export const CHATS_KEY = ["chats"] as const;

export function useChats() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: CHATS_KEY, queryFn: listChats });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CHATS_KEY });

  return {
    chats: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    rename: useMutation({ mutationFn: renameChat, onSuccess: invalidate }),
    remove: useMutation({ mutationFn: deleteChat, onSuccess: invalidate }),
  };
}
