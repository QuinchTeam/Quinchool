import { Injectable } from "@nestjs/common";
import { domainLog } from "../../core/observability/logger";

import { callAiService } from "../../shared/clients/ai/ai-client";
import type { TextGenerationModelId } from "../text-generation/text-generation.types";
import { ChatRepository, type StoredMessage } from "./chat.repository";
import type {
  ChatbotRequest,
  ChatMessage,
  DismissAction,
  ToolAction,
} from "./chatbot.contract";
import {
  type ChatbotResult,
  ChatbotService,
  type PendingToolAction,
} from "./chatbot.service";

// Older messages become a running summary to bound prompt size.
const RECENT_MESSAGES = 10;

// Batch summaries to avoid an extra model call on every turn.
const SUMMARIZE_WHEN_OVER = 20;

export interface ChatTurn {
  chatId: string;
  title: string | null;
  messageId: string;
  text: string;
  toolUsed: boolean;
  pendingAction?: PendingToolAction;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chats: ChatRepository,
    private readonly chatbot: ChatbotService,
  ) {}

  list(userId: string) {
    return this.chats.listChats(userId);
  }

  getChat(userId: string, chatId: string) {
    return this.chats.getMessages(userId, chatId);
  }

  rename(userId: string, chatId: string, title: string) {
    return this.chats.setTitle(userId, chatId, title);
  }

  remove(userId: string, chatId: string) {
    return this.chats.deleteChat(userId, chatId);
  }

  async send(userId: string, request: ChatbotRequest): Promise<ChatTurn> {
    const chat = request.chatId
      ? await this.chats.requireChat(userId, request.chatId)
      : await this.chats.createChat(userId);
    const modelId = request.modelId as TextGenerationModelId;

    await this.chats.appendMessage(chat.id, {
      role: "user",
      content: request.content,
      modelId,
    });

    const context = await this.buildContext(chat, modelId);
    const result = await this.chatbot.respond({
      ...context,
      modelId,
      userId,
    });

    return this.recordReply(userId, chat.id, chat.title, modelId, result);
  }

  // Mark the stored confirmation complete so reloads cannot offer it again.
  async confirmAction(userId: string, action: ToolAction): Promise<ChatTurn> {
    const chat = await this.chats.requireChat(userId, action.chatId);
    const modelId = action.modelId as TextGenerationModelId;
    const context = await this.buildContext(chat, modelId);
    const result = await this.chatbot.runAction(userId, action, {
      ...context,
      modelId,
    });

    await this.chats.setActionOutcome(
      userId,
      chat.id,
      action.messageId,
      "done",
    );

    return this.recordReply(userId, chat.id, chat.title, modelId, result);
  }

  dismissAction(userId: string, { chatId, messageId }: DismissAction) {
    return this.chats.setActionOutcome(userId, chatId, messageId, "dismissed");
  }

  private async recordReply(
    userId: string,
    chatId: string,
    currentTitle: string | null,
    modelId: TextGenerationModelId,
    result: ChatbotResult,
  ): Promise<ChatTurn> {
    const stored = await this.chats.appendMessage(chatId, {
      role: "assistant",
      content: result.text,
      modelId,
      toolUsed: result.toolUsed,
      pendingAction: result.pendingAction,
    });
    const title =
      currentTitle ?? (await this.titleFor(userId, chatId, modelId));

    return {
      chatId,
      title,
      messageId: stored.id,
      text: result.text,
      toolUsed: result.toolUsed,
      pendingAction: result.pendingAction,
    };
  }

  // Summarize inline only when the unsummarized tail exceeds the window.
  private async buildContext(
    chat: { id: string; summary: string | null; summarizedUpTo: number },
    modelId: TextGenerationModelId,
  ): Promise<{ messages: ChatMessage[]; summary?: string }> {
    let summary = chat.summary;
    let unsummarized = await this.chats.getUnsummarized(
      chat.id,
      chat.summarizedUpTo,
    );

    if (unsummarized.length > SUMMARIZE_WHEN_OVER) {
      const overflow = unsummarized.slice(0, -RECENT_MESSAGES);
      const folded = await this.summarize(overflow, summary, modelId);

      if (folded) {
        summary = folded;
        await this.chats.setSummary(
          chat.id,
          folded,
          overflow[overflow.length - 1].position,
        );
        unsummarized = unsummarized.slice(-RECENT_MESSAGES);
      }
    }

    return {
      messages: endOnUserTurn(unsummarized.slice(-RECENT_MESSAGES)).map(
        toChatMessage,
      ),
      summary: summary ?? undefined,
    };
  }

  // If summarizing fails, keep the longer history and retry on the next turn.
  private async summarize(
    messages: StoredMessage[],
    previousSummary: string | null,
    modelId: TextGenerationModelId,
  ): Promise<string | null> {
    try {
      const { summary } = await callAiService<{ summary: string }>(
        "/chatbot/summarize",
        {
          messages: messages.map(toChatMessage),
          modelId,
          previousSummary,
        },
        "The conversation could not be summarized.",
      );

      return summary.trim() || null;
    } catch (error) {
      domainLog("warn", "chat.summary.failed", {
        domain: "chatbot",
        errorType: error instanceof Error ? error.name : typeof error,
      });
      return null;
    }
  }

  // Fall back to the opening message if title generation fails.
  private async titleFor(
    userId: string,
    chatId: string,
    modelId: TextGenerationModelId,
  ): Promise<string | null> {
    const { messages } = await this.chats.getMessages(userId, chatId);
    const opening = messages.slice(0, 2).map(toChatMessage);

    if (opening.length === 0) return null;

    let title = opening[0].content.slice(0, 60);

    try {
      const generated = await callAiService<{ title: string }>(
        "/chatbot/title",
        { messages: opening, modelId },
        "The chat could not be titled.",
      );

      if (generated.title.trim()) title = generated.title.trim();
    } catch (error) {
      domainLog("warn", "chat.title.failed", {
        domain: "chatbot",
        errorType: error instanceof Error ? error.name : typeof error,
      });
    }

    const saved = await this.chats.setTitle(userId, chatId, title);
    return saved.title;
  }
}

function toChatMessage({ content, role }: StoredMessage): ChatMessage {
  return { content, role };
}

// After a confirmed write, drop the assistant's form so history ends on the original request.
export function endOnUserTurn(messages: StoredMessage[]): StoredMessage[] {
  const lastUser = messages.findLastIndex((message) => message.role === "user");

  return lastUser === -1 ? messages : messages.slice(0, lastUser + 1);
}
