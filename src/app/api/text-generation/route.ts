import { getTextGenerationErrorResponse } from "@/lib/ai/text-generation/errors";
import { generateText } from "@/lib/ai/text-generation/service";
import { textGenerationSchema } from "@/lib/validations/text-generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.info("API[Text Generation] - Request Body: ", body);

    const parsedBody = textGenerationSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await generateText({
      modelId: parsedBody.data.modelId,
      prompt: parsedBody.data.prompt,
    });
    console.info("API[Text Generation] - Response: ", result);
    return Response.json(result);
  } catch (error) {
    console.error("text-generation error", error);

    const errorResponse = getTextGenerationErrorResponse(error);

    if (errorResponse) {
      return Response.json(errorResponse.body, {
        status: errorResponse.status,
      });
    }

    return Response.json({ error: "Failed to generate text" }, { status: 500 });
  }
}
