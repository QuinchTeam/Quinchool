import {
  Body,
  Controller,
  HttpException,
  InternalServerErrorException,
  Post,
  UseGuards,
} from "@nestjs/common";

import { SessionGuard } from "../auth/session";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { getTextGenerationErrorResponse } from "./errors";
import { buildEnhancedPrompt } from "./prompts";
import { generateText } from "./service";
import {
  type TextGenerationValues,
  textGenerationSchema,
} from "./text-generation.contract";

/**
 * The two routes that are a single LLM call and nothing else. Both sit behind
 * the session guard: they spend provider quota, so they are not open to
 * anyone who finds the URL.
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
      const result = await generateText({
        modelId: body.modelId,
        prompt: buildEnhancedPrompt(body.prompt),
      });

      return { enhancedPrompt: result.text };
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
  const response = getTextGenerationErrorResponse(error);

  return response
    ? new HttpException(response.body, response.status)
    : new InternalServerErrorException({ error: fallback });
}
