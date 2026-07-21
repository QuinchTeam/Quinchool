import { getTextGenerationErrorResponse } from "@/lib/ai/text-generation/errors";
import { generateText } from "@/lib/ai/text-generation/service";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { buildResumeSchema } from "@/lib/validations/build-resume";
import { buildRankResumeBullet } from "@/prompts/resume-builder";

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = buildResumeSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const resumeBullets = await prisma.resumeBullet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!resumeBullets.length) {
      return Response.json(
        { error: "Add at least one experience before building a resume" },
        { status: 400 },
      );
    }

    const prompt = buildRankResumeBullet({
      jobRequirement: parsedBody.data.jobRequirement,
      resumeBullets,
    });

    const result = await generateText({
      modelId: parsedBody.data.modelId,
      prompt,
    });
    console.info("API[Build Resume] - Provider Used: ", result.providerId);

    return Response.json(result);
  } catch (error) {
    console.error("build-resume error", error);

    const errorResponse = getTextGenerationErrorResponse(error);

    if (errorResponse) {
      return Response.json(errorResponse.body, {
        status: errorResponse.status,
      });
    }

    return Response.json({ error: "Failed to build resume" }, { status: 500 });
  }
}
