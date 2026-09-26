import type { PendingToolAction } from "@/features/chatbot/lib/types";

export interface ToolActionProps {
  action: PendingToolAction;
  error: string;
  isPending: boolean;
  onDismiss: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

export type ToolActionRenderer = (props: ToolActionProps) => React.ReactNode;
