import { getTextGenerationErrorResponse } from "@/lib/ai/text-generation/errors";
import { generateChatbotResponse } from "@/lib/chatbot/service";
import { getSessionUserId } from "@/lib/session";
import { chatbotRequestSchema } from "@/lib/validations/chatbot";

export const maxDuration = 120;

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsedBody = chatbotRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return Response.json(
      await generateChatbotResponse({
        messages: parsedBody.data.messages,
        modelId: parsedBody.data.modelId,
        userId,
      }),
    );
  } catch (error) {
    console.error("chatbot error", error);

    const errorResponse = getTextGenerationErrorResponse(error);

    if (errorResponse) {
      return Response.json(errorResponse.body, {
        status: errorResponse.status,
      });
    }

    return Response.json(
      { error: "The assistant could not respond. Try again." },
      { status: 500 },
    );
  }
}
