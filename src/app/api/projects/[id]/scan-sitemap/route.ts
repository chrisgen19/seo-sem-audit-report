import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { scanSitemap } from "@/lib/sitemap";

export async function POST(
  _req: Request,
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

  let entries;
  try {
    entries = await scanSitemap(project.domain);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Failed to scan sitemap: ${msg}` },
      { status: 502 }
    );
  }

  if (entries.length === 0) {
    return Response.json({
      entries: [],
      totalFound: 0,
      alreadyImported: 0,
    });
  }

  // Normalize existing page URLs for comparison
  const existingUrls = new Set(
    project.pages.map((p) => p.url.replace(/\/$/, "").toLowerCase())
  );

  const available = entries.filter(
    (e) => !existingUrls.has(e.url.replace(/\/$/, "").toLowerCase())
  );

  return Response.json({
    entries: available,
    totalFound: entries.length,
    alreadyImported: entries.length - available.length,
  });
}
