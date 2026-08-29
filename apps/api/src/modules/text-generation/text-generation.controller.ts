import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard } from "../../core/auth/session.guard";
import { getAiErrorResponse } from "../../shared/clients/ai/ai-client.errors";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { enhancePrompt, generateText } from "./text-generation.service";
import {
  type TextGenerationValues,
  textGenerationSchema,
} from "./text-generation.contract";

/**
 * The two routes that are a single LLM call and nothing else. The call itself
 * happens in apps/ai; both routes sit behind the session guard because they
 * spend provider quota, so they are not open to anyone who finds the URL.
 */
@Controller()
@UseGuards(SessionGuard)
export class TextGenerationController {
  @Post("text-generation")
  async generate(
    @Body(new ZodValidationPipe(textGenerationSchema))
    body: TextGenerationValues,
  ) {
    try {
      return await generateText(body);
    } catch (error) {
      throw toHttpException(error, "Failed to generate text");
    }
  }

  @Post("prompt-enhancer")
  async enhance(
    @Body(new ZodValidationPipe(textGenerationSchema))
    body: TextGenerationValues,
  ) {
    try {
      return await enhancePrompt(body);
    } catch (error) {
      throw toHttpException(error, "Failed to enhance prompt");
    }
  }
}

/**
 * A provider failure already carries the status and wording a caller needs —
 * which provider ran out of quota, which model was overloaded — so it is
 * forwarded rather than flattened into a generic 500.
 */
function toHttpException(error: unknown, fallback: string): HttpException {
  const response = getAiErrorResponse(error);

  return response
    ? new HttpException(response.body, response.status)
    : new InternalServerErrorException({ error: fallback });
}
