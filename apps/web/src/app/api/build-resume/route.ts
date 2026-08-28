import { getTextGenerationErrorResponse } from "@/lib/ai/text-generation/errors";
import { generateText } from "@/lib/ai/text-generation/service";
import { prisma } from "@/lib/prisma";
import { parseJsonObject, reconcileTailoredResume } from "@/lib/resume";
import { getSessionUserId } from "@/lib/session";
import {
  buildResumeSchema,
  tailorSelectionSchema,
} from "@/lib/validations/build-resume";
import { buildTailorResumePrompt } from "@/prompts/resume-builder";

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

    // Same ordering as GET /api/career-profile, so the ids in the prompt line
    // up with the profile the preview already rendered.
    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        experiences: {
          orderBy: { sortOrder: "asc" },
          include: { bullets: { orderBy: { sortOrder: "asc" } } },
        },
        skillGroups: {
          orderBy: { sortOrder: "asc" },
          include: { skills: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });
    const experiences =
      careerProfile?.experiences.map((experience) => ({
        companyName: experience.companyName,
        jobTitle: experience.jobTitle,
        bullets: experience.bullets.map((bullet) => ({ text: bullet.text })),
      })) ?? [];
    const skillGroups =
      careerProfile?.skillGroups.map((group) => ({
        label: group.label,
        skills: group.skills.map((skill) => skill.name),
      })) ?? [];

    if (!experiences.some((experience) => experience.bullets.length)) {
      return Response.json(
        { error: "Add at least one experience before building a resume" },
        { status: 400 },
      );
    }

    const prompt = buildTailorResumePrompt({
      experiences: experiences.map((experience) => ({
        ...experience,
        bullets: experience.bullets.map((bullet) => bullet.text),
      })),
      jobRequirement: parsedBody.data.jobRequirement,
      skillGroups,
    });

    const result = await generateText({
      modelId: parsedBody.data.modelId,
      prompt,
    });
    console.info("API[Build Resume] - Provider Used: ", result.providerId);

    const selection = tailorSelectionSchema.safeParse(
      parseJsonObject(result.text),
    );

    if (!selection.success) {
      console.error("API[Build Resume] - Unparsable reply: ", result.text);

      return Response.json(
        { error: "The model returned an unreadable result. Try again." },
        { status: 502 },
      );
    }

    const tailoredResume = reconcileTailoredResume(
      { experiences, skillGroups },
      selection.data,
    );
    console.info(
      "API[Build Resume] - Tailored: ",
      JSON.stringify(tailoredResume),
    );

    return Response.json(tailoredResume);
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
