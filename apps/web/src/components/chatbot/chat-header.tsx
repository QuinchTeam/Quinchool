"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { TextModelSelector } from "@/components/text-model-selector";
import { Button } from "@/components/ui/button";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

export function ChatHeader({
  modelId,
  onModelChange,
  onNewChat,
  newChatDisabled,
}: {
  modelId: TextGenerationModelId;
  onModelChange: (modelId: TextGenerationModelId) => void;
  onNewChat: () => void;
  newChatDisabled: boolean;
}) {
  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex w-full items-end justify-between gap-3">
        <div className="w-full max-w-xs">
          <TextModelSelector
            label="Model"
            value={modelId}
            onValueChange={onModelChange}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={newChatDisabled}
          onClick={onNewChat}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          New chat
        </Button>
      </div>
    </header>
  );
}
