import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const auditRun = await db.auditRun.findFirst({
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

  const auditRun = await db.auditRun.findFirst({
    where: { id, page: { project: { organizationId: ctx.organizationId } } },
  });
  if (!auditRun) return Response.json({ error: "Not found" }, { status: 404 });

  await db.auditRun.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
