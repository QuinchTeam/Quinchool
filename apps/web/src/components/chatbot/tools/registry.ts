import { ToolActionForm } from "@/components/chatbot/tools/tool-action-form";
import type { ToolActionRenderer } from "@/components/chatbot/tools/types";

/**
 * Which component draws a pending action, keyed by the domain the API reports.
 * Domains only appear here when the default field form is not enough — a new
 * tool in an existing domain needs no change at all.
 */
const BY_DOMAIN: Record<string, ToolActionRenderer> = {
  "career-profile": ToolActionForm,
};

export function resolveToolAction(domain: string): ToolActionRenderer {
  return BY_DOMAIN[domain] ?? ToolActionForm;
}
