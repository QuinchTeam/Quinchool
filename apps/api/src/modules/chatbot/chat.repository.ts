import { Injectable, NotFoundException } from "@nestjs/common";

import type { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../core/database/prisma/prisma.service";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  position: number;
  toolUsed: boolean;
  pendingAction: unknown;
  actionOutcome: string | null;
}

const messageFields = {
  id: true,
  role: true,
  content: true,
  position: true,
  toolUsed: true,
  pendingAction: true,
  actionOutcome: true,
} as const;

function toStored(row: {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  position: number;
  toolUsed: boolean;
  pendingAction: Prisma.JsonValue;
  actionOutcome: string | null;
}): StoredMessage {
  return {
    ...row,
    role: row.role === "USER" ? "user" : "assistant",
    pendingAction: row.pendingAction ?? undefined,
  };
}

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  listChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      select: { id: true, title: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 200,
    });
  }

  createChat(userId: string) {
    return this.prisma.chat.create({
      data: { userId },
      select: { id: true, title: true, summary: true, summarizedUpTo: true },
    });
  }

  /** Every read goes through here, so a chat id from another user is a 404. */
  async requireChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true, title: true, summary: true, summarizedUpTo: true },
    });

    if (!chat) throw new NotFoundException({
        code: "CHAT_NOT_FOUND",
        message: "Chat not found",
      });

    return chat;
  }

  async getMessages(
    userId: string,
    chatId: string,
  ): Promise<{
    id: string;
    title: string | null;
    messages: StoredMessage[];
  }> {
    const chat = await this.requireChat(userId, chatId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId },
      select: messageFields,
      orderBy: { position: "asc" },
    });

    return { id: chat.id, title: chat.title, messages: messages.map(toStored) };
  }

  /** The messages the model still sees verbatim: everything past the summary. */
  async getUnsummarized(chatId: string, summarizedUpTo: number) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { chatId, position: { gt: summarizedUpTo } },
      select: messageFields,
      orderBy: { position: "asc" },
    });

    return messages.map(toStored);
  }

  async appendMessage(
    chatId: string,
    message: {
      role: "user" | "assistant";
      content: string;
      modelId?: string;
      toolUsed?: boolean;
      pendingAction?: unknown;
    },
  ): Promise<StoredMessage> {
    // The unique [chatId, position] is what keeps two concurrent sends from
    // silently interleaving into the same slot; a retry is the caller's call.
    const last = await this.prisma.chatMessage.findFirst({
      where: { chatId },
      select: { position: true },
      orderBy: { position: "desc" },
    });
    const row = await this.prisma.chatMessage.create({
      data: {
        chatId,
        role: message.role === "user" ? "USER" : "ASSISTANT",
        content: message.content,
        position: (last?.position ?? 0) + 1,
        modelId: message.modelId,
        toolUsed: message.toolUsed ?? false,
        pendingAction: (message.pendingAction ?? null) as Prisma.InputJsonValue,
      },
      select: messageFields,
    });

    await this.touch(chatId);

    return toStored(row);
  }

  async setActionOutcome(
    userId: string,
    chatId: string,
    messageId: string,
    outcome: "done" | "dismissed",
  ): Promise<void> {
    await this.requireChat(userId, chatId);
    await this.prisma.chatMessage.updateMany({
      where: { id: messageId, chatId, actionOutcome: null },
      data: { actionOutcome: outcome },
    });
  }

  async setTitle(userId: string, chatId: string, title: string) {
    await this.requireChat(userId, chatId);

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
      select: { id: true, title: true, updatedAt: true },
    });
  }

  async setSummary(chatId: string, summary: string, summarizedUpTo: number) {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { summary, summarizedUpTo },
    });
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    await this.requireChat(userId, chatId);
    await this.prisma.chat.delete({ where: { id: chatId } });
  }

  private touch(chatId: string) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
      select: { id: true },
    });
  }
}
