import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidatePage } from "@/lib/cache";

function isUnknownArgumentError(err: unknown, argName: string) {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? (err as { message?: unknown }).message : undefined;
  return typeof message === "string" && message.includes(`Unknown argument \`${argName}\``);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, pageId } = await params;

  const page = await db.page
    .findFirst({
      where: {
        id: pageId,
        projectId: id,
        project: { organizationId: ctx.organizationId },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      include: {
        project: { select: { id: true, name: true, domain: true } },
        auditRuns: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            status: true,
            provider: true,
            overallScore: true,
            overallGrade: true,
            technicalScore: true,
            technicalGrade: true,
            contentScore: true,
            contentGrade: true,
            semScore: true,
            semGrade: true,
            createdAt: true,
            completedAt: true,
            errorMessage: true,
          },
        },
      },
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.page.findFirst({
        where: {
          id: pageId,
          projectId: id,
          project: { userId: ctx.userId },
        },
        include: {
          project: { select: { id: true, name: true, domain: true } },
          auditRuns: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              status: true,
              provider: true,
              overallScore: true,
              overallGrade: true,
              technicalScore: true,
              technicalGrade: true,
              contentScore: true,
              contentGrade: true,
              semScore: true,
              semGrade: true,
              createdAt: true,
              completedAt: true,
              errorMessage: true,
            },
          },
        },
      });
    });

  if (!page) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(page);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, pageId } = await params;

  const page = await db.page
    .findFirst({
      where: {
        id: pageId,
        projectId: id,
        project: { organizationId: ctx.organizationId },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.page.findFirst({
        where: {
          id: pageId,
          projectId: id,
          project: { userId: ctx.userId },
        },
      });
    });
  if (!page) return Response.json({ error: "Not found" }, { status: 404 });

  await db.page.delete({ where: { id: pageId } });

  revalidatePage(pageId, id);

  return new Response(null, { status: 204 });
}
