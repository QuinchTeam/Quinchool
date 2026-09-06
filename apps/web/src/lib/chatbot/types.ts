import type { ChatMessage } from "@/lib/validations/chatbot";

/** One field of a tool's confirmation form, as the API describes it. */
export interface ToolField {
  name: string;
  label: string;
  type: "text" | "email" | "month" | "checkbox" | "list" | "textarea";
  placeholder?: string;
  required?: boolean;
  itemLabel?: string;
}

/**
 * A write the assistant proposed. Nothing is saved until the user submits this,
 * so the values are only ever a starting point.
 */
export interface PendingToolAction {
  tool: string;
  /** Groups renderers by feature, e.g. "career-profile". */
  domain: string;
  title: string;
  description?: string;
  fields: ToolField[];
  values: Record<string, unknown>;
  arguments: Record<string, unknown>;
  submitLabel: string;
  destructive?: boolean;
}

/** A chat message plus the bits only the browser needs. */
export interface DisplayMessage extends ChatMessage {
  id: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
  /** Set once the action is confirmed or dismissed, which retires the form. */
  actionOutcome?: "done" | "dismissed";
  /** Absent until the server has stored it, which is what the optimistic user
   * bubble and the streaming-free "Thinking..." gap look like. */
  pending?: boolean;
}

/** A row in the chat list sidebar. */
export interface ChatSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

/** A stored chat with its full history. */
export interface StoredChat {
  id: string;
  title: string | null;
  messages: DisplayMessage[];
}

/** What one send or confirmed action comes back as. */
export interface ChatTurn {
  chatId: string;
  title: string | null;
  messageId: string;
  text: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
}
