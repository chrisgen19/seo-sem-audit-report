import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, pageId } = await params;

  const page = await db.page.findFirst({
    where: {
      id: pageId,
      projectId: id,
      project: { organizationId: ctx.organizationId },
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

  const page = await db.page.findFirst({
    where: {
      id: pageId,
      projectId: id,
      project: { organizationId: ctx.organizationId },
    },
  });
  if (!page) return Response.json({ error: "Not found" }, { status: 404 });

  await db.page.delete({ where: { id: pageId } });
  return new Response(null, { status: 204 });
}
