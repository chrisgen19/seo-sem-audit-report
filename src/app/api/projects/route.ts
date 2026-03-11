import { getOrgContext, isAdmin } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateProjects } from "@/lib/cache";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().url(),
});

export async function GET() {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db.project.findMany({
    where: { organizationId: ctx.organizationId },
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
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(ctx)) {
    return Response.json({ error: "Only admins can create projects." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      domain: normalizeUrl(parsed.data.domain),
    },
  });

  revalidateProjects();

  return Response.json(project, { status: 201 });
}
