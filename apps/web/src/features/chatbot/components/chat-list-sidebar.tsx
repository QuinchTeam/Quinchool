"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
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
          <SheetHeader className="flex-row items-center justify-between">
            <SheetTitle>Chats</SheetTitle>
            <NewChatButton onNavigate={() => setListOpen(false)} />
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
        isOpen ? "w-112" : "w-0",
      )}
    >
      <div className="flex h-full w-112 flex-col">
        <div className="px-2 pt-2">
          <NewChatButton className="w-full" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <ChatList activeChatId={activeChatId} />
        </div>
      </div>
    </aside>
  );
}

function NewChatButton({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      nativeButton={false}
      render={<Link href="/chatbot" onClick={onNavigate} />}
    >
      <PlusIcon weight="regular" />
      New chat
    </Button>
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
      ) : chats.length === 0 ? null : (
        <details open className="group/recent">
          <summary className="flex cursor-pointer list-none items-center gap-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            Recent
            <CaretDownIcon
              weight="regular"
              className="size-3 transition-transform group-not-open/recent:-rotate-90"
            />
          </summary>
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
        </details>
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
          className="flex items-center gap-2"
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
            className="h-13 rounded-xl [&_input]:h-full"
          />
          <Button
            aria-label="Save name"
            size="icon"
            type="submit"
            className="rounded-full [&_svg]:size-6"
            // Prevent blur from closing the editor before its action receives the click.
            onMouseDown={(event) => event.preventDefault()}
          >
            <CheckIcon size={24} />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group relative flex w-full items-center rounded-xl hover:bg-muted focus-within:bg-muted",
        isActive && "bg-muted font-medium",
      )}
    >
      <Link
        href={`/chatbot/${chat.id}`}
        onClick={onNavigate}
        title={`${label} — ${updated.format(new Date(chat.updatedAt))}`}
        className="min-w-0 flex-1 rounded-xl py-4 px-4 text-sm group-focus-within:pr-22 group-hover:pr-22 max-md:pr-22"
      >
        <span className="chat-title-viewport">
          <span className="chat-title-text">{label}</span>
        </span>
      </Link>
      <div className="absolute right-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <Button
          aria-label={`Rename ${label}`}
          size="icon-sm"
          variant="ghost"
          onClick={() => setDraft(chat.title ?? "")}
        >
          <AppIcon icon={PencilSimpleIcon} />
        </Button>
        <Button
          aria-label={`Delete ${label}`}
          size="icon-sm"
          variant="ghost"
          onClick={onDelete}
        >
          <AppIcon icon={TrashIcon} />
        </Button>
      </div>
    </li>
  );
}
