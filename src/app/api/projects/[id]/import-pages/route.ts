import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { revalidateProject } from "@/lib/cache";
import { normalizeUrl } from "@/lib/utils";
import { z } from "zod";

const importSchema = z.object({
  pages: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1).max(200),
      })
    )
    .min(1)
    .max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { pages: { select: { url: true } } },
  });
  if (!project) return Response.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Deduplicate against existing pages
  const existingUrls = new Set(
    project.pages.map((p) => p.url.replace(/\/$/, "").toLowerCase())
  );

  const toCreate = parsed.data.pages.filter(
    (p) => !existingUrls.has(normalizeUrl(p.url).replace(/\/$/, "").toLowerCase())
  );

  if (toCreate.length === 0) {
    return Response.json({ created: 0, message: "All pages already exist." });
  }

  await db.page.createMany({
    data: toCreate.map((p) => ({
      projectId: id,
      name: p.name,
      url: normalizeUrl(p.url),
    })),
  });

  revalidateProject(id);

  return Response.json({ created: toCreate.length }, { status: 201 });
}
