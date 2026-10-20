import { ToolActionForm } from "@/features/chatbot/components/tools/tool-action-form";
import type { ToolActionRenderer } from "@/features/chatbot/components/tools/types";

// Register a domain renderer only when the default field form cannot handle its layout.
const BY_DOMAIN: Record<string, ToolActionRenderer> = {
  "career-profile": ToolActionForm,
};

export function resolveToolAction(domain: string): ToolActionRenderer {
  return BY_DOMAIN[domain] ?? ToolActionForm;
}
