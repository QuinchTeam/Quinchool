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

/**
 * How many messages the model sees word for word. Everything older is folded
 * into the chat's running summary, so prompt size stays flat no matter how long
 * a conversation runs.
 */
const RECENT_MESSAGES = 10;

/**
 * Summarizing costs a model call on the request that triggers it, so it does
 * not run every turn — only once the unsummarized tail has drifted this far
 * past the window.
 */
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

  /** Records the user's turn, answers it, and records the answer. */
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

  /**
   * Runs a confirmed write and records the follow-up turn. The stored message
   * that proposed the form is marked done, so a reload does not offer it again.
   */
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

  /**
   * Builds the prompt context, summarizing first when the tail has grown too
   * long. Without background jobs this runs inline, so it deliberately fires
   * once every ten turns rather than on every one.
   */
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

  /** A failed summary is not worth failing the user's message over: the turn
   * carries on with a longer window this time and retries next turn. */
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

  /** Titles the chat from its opening exchange, the way ChatGPT does. Falls
   * back to the first message so the sidebar never shows an untitled row. */
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

/**
 * The AI service only accepts a history ending on a user turn. Sending does
 * that anyway, but resuming after a confirmed write does not: the last stored
 * message is the assistant's form. Dropping it puts the model back on the
 * request that prompted the write, now with the tool result in hand.
 */
export function endOnUserTurn(messages: StoredMessage[]): StoredMessage[] {
  const lastUser = messages.findLastIndex((message) => message.role === "user");

  return lastUser === -1 ? messages : messages.slice(0, lastUser + 1);
}
