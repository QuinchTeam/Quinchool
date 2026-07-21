import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { createResumeBulletSchema } from "@/lib/validations/resume-bullet";

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resumeBullets = await prisma.resumeBullet.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(resumeBullets);
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createResumeBulletSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const resumeBullet = await prisma.resumeBullet.create({
    data: { ...parsed.data, userId },
  });

  return Response.json(resumeBullet, { status: 201 });
}
