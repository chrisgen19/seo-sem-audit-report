import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
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

  return Response.json(page, { status: 201 });
}
