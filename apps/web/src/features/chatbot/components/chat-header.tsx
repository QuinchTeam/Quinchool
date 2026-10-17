"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { SidebarIcon } from "@phosphor-icons/react/dist/ssr/Sidebar";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";

import { TextModelSelector } from "@/components/shared/text-model-selector";
import { Button } from "@/components/ui/button";
import type { TextGenerationModelId } from "@/lib/ai/text-generation/types";

export function ChatHeader({
  isListOpen,
  modelId,
  onModelChange,
  onToggleList,
  title,
}: {
  isListOpen: boolean;
  modelId: TextGenerationModelId;
  onModelChange: (modelId: TextGenerationModelId) => void;
  onToggleList: () => void;
  title: string | null;
}) {
  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex w-full items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="w-full max-w-xs">
            <TextModelSelector
              label="Model"
              value={modelId}
              onValueChange={onModelChange}
            />
          </div>
          {title ? (
            <p className="min-w-0 truncate pb-2 text-sm text-muted-foreground">
              {title}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* A new chat is just the untitled route: the row appears in the list
              once the first message has actually created it. */}
          <Button
            type="button"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/chatbot" />}
          >
            <AppIcon icon={PlusIcon} />
            New chat
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle chat list"
            aria-expanded={isListOpen}
            onClick={onToggleList}
          >
            <AppIcon icon={SidebarIcon} />
          </Button>
        </div>
      </div>
    </header>
  );
}
