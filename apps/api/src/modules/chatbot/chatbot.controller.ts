import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { getAiErrorResponse } from "../../shared/clients/ai/ai-client.errors";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  type ChatbotRequest,
  chatbotRequestSchema,
} from "./chatbot.contract";
import { type ChatbotResult, ChatbotService } from "./chatbot.service";

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
      const response = getAiErrorResponse(error);

      if (response) {
        throw new HttpException(response.body, response.status);
      }

      throw new InternalServerErrorException({
        error: "The assistant could not respond. Try again.",
      });
    }
  }
}
