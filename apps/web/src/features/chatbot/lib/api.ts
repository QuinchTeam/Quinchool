import type {
  ChatSummary,
  ChatTurn,
  PendingToolAction,
  StoredChat,
} from "@/features/chatbot/lib/types";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, readApiData, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

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

export async function sendChatMessage(body: {
  chatId?: string;
  content: string;
  modelId: TextGenerationModelId;
}): Promise<ChatTurn> {
  return observeOperation("chatbot.send-message", async () => {
    const turn = await request<ChatTurn>("/chatbot/messages", {
      method: "POST",
      body,
    });

    // A pending tool form is a valid reply even when its text is empty.
    if (!turn.text && !turn.pendingAction) {
      throw new Error(FALLBACK_ERROR);
    }

    return turn;
  });
}

// Return the model's follow-up after the user confirms a write.
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
  return request<ChatTurn>("/chatbot/action-confirmations", {
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
  return request<void>("/chatbot/action-dismissals", {
    method: "POST",
    body,
  });
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  return observeOperation("chatbot.request", async () => {
    const response = await apiFetch(apiUrl(path), {
      ...withCredentials,
      method: init.method ?? "GET",
      headers: init.body ? { "Content-Type": "application/json" } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    return readApiData<T>(response, FALLBACK_ERROR);
  });
}
