"use client";

import { ChatComposer } from "@/components/chatbot/chat-composer";
import { ChatEmptyState } from "@/components/chatbot/chat-empty-state";
import { ChatHeader } from "@/components/chatbot/chat-header";
import { ChatMessages } from "@/components/chatbot/chat-messages";
import { useChatbot } from "@/hooks/use-chatbot";

export function Chatbot() {
  const chat = useChatbot();

  return (
    <div className="flex h-svh min-h-0 flex-col bg-background">
      <ChatHeader
        modelId={chat.modelId}
        onModelChange={chat.setModelId}
        onNewChat={chat.startNewChat}
        newChatDisabled={chat.isPending || chat.messages.length === 0}
      />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
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
  );
}
