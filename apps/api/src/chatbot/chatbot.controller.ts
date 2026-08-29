import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard, UserId } from "../auth/session";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { getTextGenerationErrorResponse } from "../text-generation/errors";
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
      const response = getTextGenerationErrorResponse(error);

      if (response) {
        throw new HttpException(response.body, response.status);
      }

      throw new InternalServerErrorException({
        error: "The assistant could not respond. Try again.",
      });
    }
  }
}
