"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { SidebarIcon } from "@phosphor-icons/react/dist/ssr/Sidebar";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";

import { TextModelSelector } from "@/components/shared/text-model-selector";
import { Button } from "@/components/ui/button";
import { useChatbotStore } from "@/features/chatbot/store/chatbot-store";

export function ChatHeader({ title }: { title: string | null }) {
  const { isListOpen, modelId, setModelId, toggleList } = useChatbotStore();

  return (
    <header className="border-b px-4 py-3 md:px-6">
      <div className="flex w-full items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <div className="w-full min-w-0 max-w-xs">
            <TextModelSelector
              label="Model"
              value={modelId}
              onValueChange={setModelId}
            />
          </div>
          {title ? (
            <p className="min-w-0 truncate pb-2 text-sm text-muted-foreground max-md:hidden">
              {title}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Icon-only on mobile so the model picker keeps its room. */}
          <Button
            type="button"
            variant="ghost"
            className="max-md:size-14 max-md:p-0"
            nativeButton={false}
            render={<Link href="/chatbot" />}
          >
            <PlusIcon weight="regular" />
            <span className="max-md:sr-only">New chat</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle chat list"
            aria-expanded={isListOpen}
            onClick={toggleList}
          >
            <AppIcon icon={SidebarIcon} />
          </Button>
        </div>
      </div>
    </header>
  );
}
