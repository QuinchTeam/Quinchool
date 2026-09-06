import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";
import { apiUrl, withCredentials } from "@/lib/api";
import type {
  ChatbotReply,
  ChatbotResponse,
  DisplayMessage,
  PendingToolAction,
} from "@/lib/chatbot/types";

// chatbotRequestSchema rejects anything longer, so trim the history here.
const MAX_HISTORY = 24;

const FALLBACK_ERROR = "The assistant could not respond.";

export async function sendChatMessage({
  messages,
  modelId,
}: {
  messages: DisplayMessage[];
  modelId: TextGenerationModelId;
}): Promise<ChatbotReply> {
  const body = await post<ChatbotResponse>("/chatbot", {
    messages: messages.slice(-MAX_HISTORY).map(({ content, role }) => ({
      content,
      role,
    })),
    modelId,
  });

  // A tool call can leave the text empty, but a pending form is still a reply.
  if (!body.text && !body.pendingAction) {
    throw new Error(body.error || FALLBACK_ERROR);
  }

  return {
    text: body.text ?? "",
    toolUsed: body.toolUsed,
    pendingAction: body.pendingAction,
  };
}

/**
 * Runs a write the user confirmed. The reply is a normal chat turn: the model
 * gets to react to what changed, so a confirmation can carry the chain on.
 */
export async function runToolAction({
  action,
  messages,
  modelId,
  values,
}: {
  action: PendingToolAction;
  messages: DisplayMessage[];
  modelId: TextGenerationModelId;
  values: Record<string, unknown>;
}): Promise<ChatbotReply> {
  const body = await post<ChatbotResponse>("/chatbot/actions", {
    tool: action.tool,
    arguments: action.arguments,
    values,
    messages: messages.slice(-MAX_HISTORY).map(({ content, role }) => ({
      content,
      role,
    })),
    modelId,
  });

  return {
    text: body.text ?? "",
    toolUsed: body.toolUsed,
    pendingAction: body.pendingAction,
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...withCredentials,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const parsed = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok || !parsed) {
    throw new Error(parsed?.error || FALLBACK_ERROR);
  }

  return parsed;
}
