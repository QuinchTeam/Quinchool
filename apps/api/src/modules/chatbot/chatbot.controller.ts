import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { getAiErrorResponse } from "../../shared/clients/ai/ai-client.errors";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  type ChatbotRequest,
  chatbotRequestSchema,
  type ToolAction,
  toolActionSchema,
} from "./chatbot.contract";
import { type ChatbotResult, ChatbotService } from "./chatbot.service";
import { ToolExecutionError } from "./tools/tool.types";

@Controller("chatbot")
@UseGuards(SessionGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post()
  async respond(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(chatbotRequestSchema)) body: ChatbotRequest,
  ): Promise<ChatbotResult> {
    try {
      return await this.chatbot.respond({
        messages: body.messages,
        modelId: body.modelId,
        userId,
      });
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw new UnprocessableEntityException({ error: error.message });
      }

      const response = getAiErrorResponse(error);

      if (response) {
        throw new HttpException(response.body, response.status);
      }

      throw new InternalServerErrorException({
        error: "The assistant could not respond. Try again.",
      });
    }
  }

  /** Runs a write the user confirmed in the chat. */
  @Post("actions")
  async runAction(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(toolActionSchema)) body: ToolAction,
  ): Promise<ChatbotResult> {
    try {
      return await this.chatbot.runAction(userId, body);
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw new UnprocessableEntityException({ error: error.message });
      }

      throw new InternalServerErrorException({
        error: "That change could not be saved. Try again.",
      });
    }
  }
}
