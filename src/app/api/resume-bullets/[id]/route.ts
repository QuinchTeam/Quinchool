import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { updateResumeBulletSchema } from "@/lib/validations/resume-bullet";

// Scoping the write by userId as well as id means another user's bullet is not
// just hidden but unreachable — a mismatched owner raises P2025 (not found)
// rather than silently editing someone else's row.
function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2025"
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateResumeBulletSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const resumeBullet = await prisma.resumeBullet.update({
      where: { id, userId },
      data: parsed.data,
    });

    return Response.json(resumeBullet);
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.resumeBullet.delete({ where: { id, userId } });

    return new Response(null, { status: 204 });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    throw error;
  }
}
