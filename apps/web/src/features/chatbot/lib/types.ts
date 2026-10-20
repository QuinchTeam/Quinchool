import type { ChatMessage } from "@/features/chatbot/validations/chatbot";

export interface ToolField {
  name: string;
  label: string;
  type: "text" | "email" | "month" | "checkbox" | "list" | "textarea";
  placeholder?: string;
  required?: boolean;
  itemLabel?: string;
}

// Suggested values are not saved until the confirmation form is submitted.
export interface PendingToolAction {
  tool: string;
  domain: string;
  title: string;
  description?: string;
  fields: ToolField[];
  values: Record<string, unknown>;
  arguments: Record<string, unknown>;
  submitLabel: string;
  destructive?: boolean;
}

export interface DisplayMessage extends ChatMessage {
  id: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
  // Completing or dismissing an action retires its confirmation form.
  actionOutcome?: "done" | "dismissed";
  // Optimistic messages stay pending until the server stores them.
  pending?: boolean;
}

export interface ChatSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface StoredChat {
  id: string;
  title: string | null;
  messages: DisplayMessage[];
}

export interface ChatTurn {
  chatId: string;
  title: string | null;
  messageId: string;
  text: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
}
