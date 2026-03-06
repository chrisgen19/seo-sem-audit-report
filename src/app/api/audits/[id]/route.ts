import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const auditRun = await db.auditRun.findFirst({
    where: {
      id,
      page: { project: { userId: session.user.id } },
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
