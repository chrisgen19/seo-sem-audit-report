import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

  const { ids } = parsed.data;

  await db.auditRun.deleteMany({
    where: {
      id: { in: ids },
      page: { project: { organizationId: ctx.organizationId } },
    },
  });

  return new Response(null, { status: 204 });
}
