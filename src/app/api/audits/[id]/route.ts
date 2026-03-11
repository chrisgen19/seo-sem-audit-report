import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateAudit } from "@/lib/cache";

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

  const auditRun = await db.auditRun
    .findFirst({
      where: {
        id,
        page: { project: { organizationId: ctx.organizationId } },
      },
      include: {
        page: {
          select: {
            id: true,
            name: true,
            url: true,
            project: { select: { id: true, name: true, domain: true } },
          },
        },
        checks: { orderBy: { section: "asc" } },
        meta: true,
      },
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.auditRun.findFirst({
        where: {
          id,
          page: { project: { userId: ctx.userId } },
        },
        include: {
          page: {
            select: {
              id: true,
              name: true,
              url: true,
              project: { select: { id: true, name: true, domain: true } },
            },
          },
          checks: { orderBy: { section: "asc" } },
          meta: true,
        },
      });
    });

  if (!auditRun) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(auditRun);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const auditRun = await db.auditRun
    .findFirst({
      where: { id, page: { project: { organizationId: ctx.organizationId } } },
      include: { page: { select: { id: true, projectId: true } } },
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.auditRun.findFirst({
        where: { id, page: { project: { userId: ctx.userId } } },
        include: { page: { select: { id: true, projectId: true } } },
      });
    });
  if (!auditRun) return Response.json({ error: "Not found" }, { status: 404 });

  await db.auditRun.delete({ where: { id } });

  revalidateAudit(id, auditRun.page.id, auditRun.page.projectId);

  return new Response(null, { status: 204 });
}
