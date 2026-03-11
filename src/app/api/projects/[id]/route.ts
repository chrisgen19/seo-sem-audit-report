import { getOrgContext, isAdmin } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateProject } from "@/lib/cache";

function isUnknownArgumentError(err: unknown, argName: string) {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? (err as { message?: unknown }).message : undefined;
  return typeof message === "string" && message.includes(`Unknown argument \`${argName}\``);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project
    .findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: {
        pages: {
          orderBy: { createdAt: "asc" },
          include: {
            auditRuns: {
              where: { status: "done" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                overallScore: true,
                overallGrade: true,
                technicalScore: true,
                contentScore: true,
                semScore: true,
                createdAt: true,
                status: true,
              },
            },
            _count: { select: { auditRuns: true } },
          },
        },
      },
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.project.findFirst({
        where: { id, userId: ctx.userId },
        include: {
          pages: {
            orderBy: { createdAt: "asc" },
            include: {
              auditRuns: {
                where: { status: "done" },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  id: true,
                  overallScore: true,
                  overallGrade: true,
                  technicalScore: true,
                  contentScore: true,
                  semScore: true,
                  createdAt: true,
                  status: true,
                },
              },
              _count: { select: { auditRuns: true } },
            },
          },
        },
      });
    });

  if (!project) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(project);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(ctx)) {
    return Response.json({ error: "Only admins can delete projects." }, { status: 403 });
  }

  const { id } = await params;

  const project = await db.project
    .findFirst({
      where: { id, organizationId: ctx.organizationId },
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.project.findFirst({ where: { id, userId: ctx.userId } });
    });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  await db.project.delete({ where: { id } });

  revalidateProject(id);

  return new Response(null, { status: 204 });
}
