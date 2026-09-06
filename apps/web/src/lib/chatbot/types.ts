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
}

export interface ChatbotResponse {
  error?: string;
  text?: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
}

export interface ChatbotReply {
  text: string;
  toolUsed?: boolean;
  pendingAction?: PendingToolAction;
}
