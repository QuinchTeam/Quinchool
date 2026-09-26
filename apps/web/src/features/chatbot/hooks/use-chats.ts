"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteChat, listChats, renameChat } from "@/features/chatbot/lib/api";

export const CHATS_KEY = ["chats"] as const;

/** The chat list behind the sidebar. Sending a message invalidates this, which
 * is how a new chat and its generated title turn up in the list. */
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
