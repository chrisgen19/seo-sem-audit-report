import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateProjects } from "@/lib/cache";
import { z } from "zod";

function isUnknownArgumentError(err: unknown, argName: string) {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? (err as { message?: unknown }).message : undefined;
  return typeof message === "string" && message.includes(`Unknown argument \`${argName}\``);
}

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function DELETE(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid input" }, { status: 400 });

  const { ids } = parsed.data;

  await db.auditRun
    .deleteMany({
      where: {
        id: { in: ids },
        page: { project: { organizationId: ctx.organizationId } },
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.auditRun.deleteMany({
        where: {
          id: { in: ids },
          page: { project: { userId: ctx.userId } },
        },
      });
    });

  revalidateProjects();

  return new Response(null, { status: 204 });
}
