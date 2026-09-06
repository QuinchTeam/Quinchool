"use client";

import { useState } from "react";

import { ChatComposer } from "@/components/chatbot/chat-composer";
import { ChatEmptyState } from "@/components/chatbot/chat-empty-state";
import { ChatHeader } from "@/components/chatbot/chat-header";
import { ChatListSidebar } from "@/components/chatbot/chat-list-sidebar";
import { ChatMessages } from "@/components/chatbot/chat-messages";
import { useChatbot } from "@/hooks/use-chatbot";

export function Chatbot({ chatId }: { chatId?: string }) {
  const chat = useChatbot(chatId);
  const [isListOpen, setIsListOpen] = useState(false);

  return (
    <div className="flex h-svh min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <ChatHeader
          isListOpen={isListOpen}
          modelId={chat.modelId}
          onModelChange={chat.setModelId}
          onToggleList={() => setIsListOpen((open) => !open)}
          title={chat.title}
        />

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

        <ChatComposer
          isPending={chat.isPending}
          onChange={chat.setInput}
          onSend={chat.sendMessage}
          value={chat.input}
        />
      </div>

      <ChatListSidebar activeChatId={chatId} isOpen={isListOpen} />
    </div>
  );
}
