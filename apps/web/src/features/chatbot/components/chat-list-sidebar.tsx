"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { AppIcon } from "@/components/ui/icon";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats } from "@/features/chatbot/hooks/use-chats";
import { useChatbotStore } from "@/features/chatbot/store/chatbot-store";
import type { ChatSummary } from "@/features/chatbot/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const updated = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

// Use a flex sibling; another SidebarProvider would share the nav cookie and shortcut.
// On mobile the list opens as a sheet instead, so it never squeezes the conversation.
export function ChatListSidebar({ activeChatId }: { activeChatId?: string }) {
  const isOpen = useChatbotStore((state) => state.isListOpen);
  const setListOpen = useChatbotStore((state) => state.setListOpen);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setListOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Chats</SheetTitle>
          </SheetHeader>
          <SheetBody className="p-2">
            <ChatList
              activeChatId={activeChatId}
              onNavigate={() => setListOpen(false)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      aria-label="Chats"
      aria-hidden={!isOpen}
      className={cn(
        "shrink-0 overflow-hidden border-l transition-all duration-200",
        isOpen ? "w-72" : "w-0",
      )}
    >
      <div className="flex h-full w-72 flex-col">
        <header className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Chats</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <ChatList activeChatId={activeChatId} />
        </div>
      </div>
    </aside>
  );
}

function ChatList({
  activeChatId,
  onNavigate,
}: {
  activeChatId?: string;
  onNavigate?: () => void;
}) {
  const { chats, isError, isLoading, remove, rename } = useChats();

  return (
    <>
      {isLoading ? (
        <output className="grid gap-2 p-2" aria-label="Loading chats">
          {["a", "b", "c"].map((key) => (
            <Skeleton key={key} className="h-9 w-full" />
          ))}
        </output>
      ) : isError ? (
        <p className="p-2 text-sm text-muted-foreground">
          Could not load your chats.
        </p>
      ) : chats.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">
          No chats yet. Send a message to start one.
        </p>
      ) : (
        <ul className="grid gap-1">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onDelete={() => remove.mutate(chat.id)}
              onNavigate={onNavigate}
              onRename={(title) => rename.mutate({ chatId: chat.id, title })}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function ChatRow({
  chat,
  isActive,
  onDelete,
  onNavigate,
  onRename,
}: {
  chat: ChatSummary;
  isActive: boolean;
  onDelete: () => void;
  onNavigate?: () => void;
  onRename: (title: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const label = chat.title || "New chat";

  if (draft !== null) {
    return (
      <li>
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) onRename(draft.trim());
            setDraft(null);
          }}
        >
          <Input
            aria-label="Chat name"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setDraft(null)}
            className="h-8"
          />
          <Button
            aria-label="Save name"
            size="icon-sm"
            type="submit"
            variant="ghost"
            // Prevent blur from closing the editor before its action receives the click.
            onMouseDown={(event) => event.preventDefault()}
          >
            <AppIcon icon={CheckIcon} />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-1">
      <Link
        href={`/chatbot/${chat.id}`}
        onClick={onNavigate}
        title={`${label} — ${updated.format(new Date(chat.updatedAt))}`}
        className={cn(
          "min-w-0 flex-1 truncate rounded px-2 py-1.5 text-sm hover:bg-muted",
          isActive && "bg-muted font-medium",
        )}
      >
        {label}
      </Link>
      <Button
        aria-label={`Rename ${label}`}
        size="icon-sm"
        variant="ghost"
        // Touch screens have no hover, so the actions stay visible on mobile.
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100"
        onClick={() => setDraft(chat.title ?? "")}
      >
        <AppIcon icon={PencilSimpleIcon} />
      </Button>
      <Button
        aria-label={`Delete ${label}`}
        size="icon-sm"
        variant="ghost"
        // Touch screens have no hover, so the actions stay visible on mobile.
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100"
        onClick={onDelete}
      >
        <AppIcon icon={TrashIcon} />
      </Button>
    </li>
  );
}
