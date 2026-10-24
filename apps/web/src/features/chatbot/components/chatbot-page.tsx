"use client";

import { ChatComposer } from "@/features/chatbot/components/chat-composer";
import { ChatEmptyState } from "@/features/chatbot/components/chat-empty-state";
import { ChatHeader } from "@/features/chatbot/components/chat-header";
import { ChatListSidebar } from "@/features/chatbot/components/chat-list-sidebar";
import { ChatMessages } from "@/features/chatbot/components/chat-messages";
import { useChatbot } from "@/features/chatbot/hooks/use-chatbot";

export function ChatbotPage({ chatId }: { chatId?: string }) {
  const chat = useChatbot(chatId);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader title={chat.title} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          {chat.messages.length === 0 && !chat.isLoading ? (
            <ChatEmptyState onSelect={chat.sendMessage} />
          ) : (
            <ChatMessages
              action={chat.action}
              endRef={chat.endRef}
              error={chat.error}
              isPending={chat.isPending}
              messages={chat.messages}
            />
          )}
        </main>

        <ChatComposer isPending={chat.isPending} onSend={chat.sendMessage} />
      </div>

      <ChatListSidebar activeChatId={chatId} />
    </div>
  );
}
