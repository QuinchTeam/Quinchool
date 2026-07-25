import { getTextGenerationErrorResponse } from "@/lib/ai/text-generation/errors";
import { generateText } from "@/lib/ai/text-generation/service";
import { textGenerationSchema } from "@/lib/validations/text-generation";
import { buildEnhancedPrompt } from "@/prompts/prompt-enhancer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = textGenerationSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await generateText({
      modelId: parsedBody.data.modelId,
      prompt: buildEnhancedPrompt(parsedBody.data.prompt),
    });

    return Response.json({ enhancedPrompt: result.text });
  } catch (error) {
    const errorResponse = getTextGenerationErrorResponse(error);

    if (errorResponse) {
      return Response.json(errorResponse.body, {
        status: errorResponse.status,
      });
    }

    return Response.json({ error: "Failed to enhance prompt" }, { status: 500 });
  }
}
