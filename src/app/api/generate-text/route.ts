import { getTextGenerationErrorResponse } from "@/lib/text-generation/errors";
import { generateText } from "@/lib/text-generation/service";
import { textGenerationSchema } from "@/lib/validations/text-generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedBody = textGenerationSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await generateText({
      modelId: parsedBody.data.modelId,
      prompt: parsedBody.data.prompt,
    });

    return Response.json(result);
  } catch (error) {
    console.error("generate-text error", error);

    const errorResponse = getTextGenerationErrorResponse(error);

    if (errorResponse) {
      return Response.json(errorResponse.body, {
        status: errorResponse.status,
      });
    }

    return Response.json({ error: "Failed to generate text" }, { status: 500 });
  }
}
