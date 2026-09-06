import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { getAiErrorResponse } from "../../shared/clients/ai/ai-client.errors";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  chatIdSchema,
  type ChatbotRequest,
  chatbotRequestSchema,
  type ChatTitle,
  chatTitleSchema,
  type DismissAction,
  dismissActionSchema,
  type ToolAction,
  toolActionSchema,
} from "./chatbot.contract";
import { type ChatTurn, ChatService } from "./chat.service";
import { ToolExecutionError } from "./tools/tool.types";

@Controller("chatbot")
@UseGuards(SessionGuard)
export class ChatbotController {
  constructor(private readonly chats: ChatService) {}

  @Get("chats")
  list(@UserId() userId: string) {
    return this.chats.list(userId);
  }

  @Get("chats/:id")
  getChat(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(chatIdSchema)) id: string,
  ) {
    return this.chats.getChat(userId, id);
  }

  @Patch("chats/:id")
  rename(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(chatIdSchema)) id: string,
    @Body(new ZodValidationPipe(chatTitleSchema)) body: ChatTitle,
  ) {
    return this.chats.rename(userId, id, body.title);
  }

  @Delete("chats/:id")
  @HttpCode(204)
  remove(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(chatIdSchema)) id: string,
  ) {
    return this.chats.remove(userId, id);
  }

  @Post()
  async respond(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(chatbotRequestSchema)) body: ChatbotRequest,
  ): Promise<ChatTurn> {
    try {
      return await this.chats.send(userId, body);
    } catch (error) {
      throw toHttpError(error, "The assistant could not respond. Try again.");
    }
  }

  /** Runs a write the user confirmed in the chat. */
  @Post("actions")
  async runAction(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(toolActionSchema)) body: ToolAction,
  ): Promise<ChatTurn> {
    try {
      return await this.chats.confirmAction(userId, body);
    } catch (error) {
      throw toHttpError(error, "That change could not be saved. Try again.");
    }
  }

  /** Records that the user declined a proposed write, so it stays declined. */
  @Post("actions/dismiss")
  @HttpCode(204)
  dismissAction(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(dismissActionSchema)) body: DismissAction,
  ) {
    return this.chats.dismissAction(userId, body);
  }
}

function toHttpError(error: unknown, fallback: string): HttpException {
  if (error instanceof HttpException) return error;

  if (error instanceof ToolExecutionError) {
    return new UnprocessableEntityException({ error: error.message });
  }

  const response = getAiErrorResponse(error);

  if (response) return new HttpException(response.body, response.status);

  return new InternalServerErrorException({ error: fallback });
}
