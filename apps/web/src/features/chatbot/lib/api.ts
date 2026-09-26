import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, withCredentials } from "@/lib/api";
import type {
  ChatSummary,
  ChatTurn,
  PendingToolAction,
  StoredChat,
} from "@/features/chatbot/lib/types";

const FALLBACK_ERROR = "The assistant could not respond.";

export function listChats(): Promise<ChatSummary[]> {
  return request<ChatSummary[]>("/chatbot/chats");
}

export function getChat(chatId: string): Promise<StoredChat> {
  return request<StoredChat>(`/chatbot/chats/${chatId}`);
}

export function renameChat({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}): Promise<ChatSummary> {
  return request<ChatSummary>(`/chatbot/chats/${chatId}`, {
    method: "PATCH",
    body: { title },
  });
}

export function deleteChat(chatId: string): Promise<void> {
  return request<void>(`/chatbot/chats/${chatId}`, { method: "DELETE" });
}

/** Sends a message. Omitting `chatId` starts a new chat server-side, so an
 * abandoned "New chat" never leaves an empty row in the sidebar. */
export async function sendChatMessage(body: {
  chatId?: string;
  content: string;
  modelId: TextGenerationModelId;
}): Promise<ChatTurn> {
  const turn = await request<ChatTurn>("/chatbot", { method: "POST", body });

  // A tool call can leave the text empty, but a pending form is still a reply.
  if (!turn.text && !turn.pendingAction) {
    throw new Error(FALLBACK_ERROR);
  }

  return turn;
}

/**
 * Runs a write the user confirmed. The reply is a normal chat turn: the model
 * gets to react to what changed, so a confirmation can carry the chain on.
 */
export function runToolAction({
  action,
  chatId,
  messageId,
  modelId,
  values,
}: {
  action: PendingToolAction;
  chatId: string;
  messageId: string;
  modelId: TextGenerationModelId;
  values: Record<string, unknown>;
}): Promise<ChatTurn> {
  return request<ChatTurn>("/chatbot/actions", {
    method: "POST",
    body: {
      chatId,
      messageId,
      tool: action.tool,
      arguments: action.arguments,
      values,
      modelId,
    },
  });
}

export function dismissToolAction(body: {
  chatId: string;
  messageId: string;
}): Promise<void> {
  return request<void>("/chatbot/actions/dismiss", { method: "POST", body });
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...withCredentials,
    method: init.method ?? "GET",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const parsed = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok || !parsed) {
    throw new Error(parsed?.error || FALLBACK_ERROR);
  }

  return parsed;
}
