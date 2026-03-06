import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pages: true } },
      pages: {
        orderBy: { createdAt: "desc" },
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
        },
      },
    },
  });

  return Response.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      domain: normalizeUrl(parsed.data.domain),
    },
  });

  return Response.json(project, { status: 201 });
}
