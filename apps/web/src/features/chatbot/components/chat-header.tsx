"use client";

import { SidebarIcon } from "@phosphor-icons/react/dist/ssr/Sidebar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppIcon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useChats } from "@/features/chatbot/hooks/use-chats";
import {
  chatTitleSchema,
  type ChatTitle,
} from "@/features/chatbot/validations/chatbot";

import { Button } from "@/components/ui/button";
import { useChatbotStore } from "@/features/chatbot/store/chatbot-store";

export function ChatHeader({
  chatId,
  title,
}: {
  chatId?: string;
  title: string | null;
}) {
  const { isListOpen, toggleList } = useChatbotStore();
  const { rename } = useChats();
  const [isEditing, setEditing] = useState(false);
  const form = useForm<ChatTitle>({
    resolver: zodResolver(chatTitleSchema),
    defaultValues: { title: title ?? "" },
  });

  return (
    <header className="border-b px-4 py-3 md:px-6">
      <div className="relative flex h-14 w-full items-center justify-start pr-16">
        {isEditing && chatId ? (
          <Form {...form}>
            <form
              className="relative flex h-10 w-full max-w-2xl items-center gap-2"
              aria-label="Rename chat"
              onSubmit={form.handleSubmit((values) => {
                rename.mutate(
                  { chatId, ...values },
                  { onSuccess: () => setEditing(false) },
                );
              })}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !rename.isPending)
                  setEditing(false);
              }}
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        aria-label="Chat title"
                        autoFocus
                        maxLength={120}
                        disabled={rename.isPending}
                        className="h-10 text-left text-base font-medium [&_input]:h-full [&_input]:text-base"
                      />
                    </FormControl>
                    <FormMessage className="absolute top-full left-0 z-10 mt-2 rounded bg-card px-2 py-1" />
                  </FormItem>
                )}
              />
              <div className="flex shrink-0 items-center gap-2">
                <Button type="submit" size="xs" loading={rename.isPending}>
                  Save
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={rename.isPending}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
              {rename.error ? (
                <p
                  role="alert"
                  className="absolute top-full left-0 z-10 mt-2 rounded bg-card px-2 py-1 text-sm text-destructive"
                >
                  {rename.error.message}
                </p>
              ) : null}
            </form>
          </Form>
        ) : (
          <h1 className="min-w-0 text-left text-base font-medium">
            {chatId ? (
              <button
                type="button"
                aria-label="Edit chat title"
                className="flex max-w-full cursor-text items-center rounded px-2 py-1 hover:bg-muted focus-visible:outline-ring"
                onClick={() => {
                  form.reset({ title: title ?? "" });
                  rename.reset();
                  setEditing(true);
                }}
              >
                <span className="truncate">{title || "New chat"}</span>
              </button>
            ) : (
              title
            )}
          </h1>
        )}
        <div className="absolute inset-y-0 right-0 flex shrink-0 items-center gap-1">
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
