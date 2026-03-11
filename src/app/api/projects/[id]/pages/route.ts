import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateProject } from "@/lib/cache";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

function isUnknownArgumentError(err: unknown, argName: string) {
  if (!err || typeof err !== "object") return false;
  const message = "message" in err ? (err as { message?: unknown }).message : undefined;
  return typeof message === "string" && message.includes(`Unknown argument \`${argName}\``);
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project
    .findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { id, organizationId: ctx.organizationId } as any,
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.project.findFirst({ where: { id, userId: ctx.userId } });
    });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const pages = await db.page.findMany({
    where: { projectId: id },
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
  });

  return Response.json(pages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project
    .findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { id, organizationId: ctx.organizationId } as any,
    })
    .catch((err) => {
      if (!isUnknownArgumentError(err, "organizationId")) throw err;
      return db.project.findFirst({ where: { id, userId: ctx.userId } });
    });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const page = await db.page.create({
    data: {
      projectId: id,
      name: parsed.data.name,
      url: normalizeUrl(parsed.data.url),
    },
  });

  revalidateProject(id);

  return Response.json(page, { status: 201 });
}
