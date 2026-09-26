"use client";

import {
  Delete02Icon,
  PencilEdit02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useChats } from "@/features/chatbot/hooks/use-chats";
import type { ChatSummary } from "@/features/chatbot/lib/types";
import { cn } from "@/lib/utils";

const updated = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

/**
 * The chat list. Rendered as a flex sibling rather than a second
 * `SidebarProvider`, because the dashboard already owns one for the app nav and
 * nesting them fights over the same cookie and keyboard shortcut.
 */
export function ChatListSidebar({
  activeChatId,
  isOpen,
}: {
  activeChatId?: string;
  isOpen: boolean;
}) {
  const { chats, isError, isLoading, remove, rename } = useChats();

  return (
    <aside
      aria-label="Chats"
      aria-hidden={!isOpen}
      className={cn(
        "shrink-0 overflow-hidden border-l bg-background transition-all duration-200",
        isOpen ? "w-72" : "w-0",
      )}
    >
      <div className="flex h-full w-72 flex-col">
        <header className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Chats</h2>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
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
                  onRename={(title) =>
                    rename.mutate({ chatId: chat.id, title })
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

function ChatRow({
  chat,
  isActive,
  onDelete,
  onRename,
}: {
  chat: ChatSummary;
  isActive: boolean;
  onDelete: () => void;
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
            // Blur fires before click, so commit on pointer down instead.
            onMouseDown={(event) => event.preventDefault()}
          >
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-1">
      <Link
        href={`/chatbot/${chat.id}`}
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
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onClick={() => setDraft(chat.title ?? "")}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} />
      </Button>
      <Button
        aria-label={`Delete ${label}`}
        size="icon-sm"
        variant="ghost"
        className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onClick={onDelete}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </Button>
    </li>
  );
}
