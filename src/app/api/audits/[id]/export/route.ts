import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { generateDocxReport } from "@/lib/report";
import type {
  ReportCheck,
  ReportQuickWin,
  ReportAdGroup,
} from "@/lib/report";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOrgContext();
  if (!ctx) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const auditRun = await db.auditRun.findFirst({
    where: { id, page: { project: { organizationId: ctx.organizationId } } },
    include: {
      page: {
        select: {
          name: true,
          url: true,
          project: { select: { name: true } },
        },
      },
      checks: { orderBy: [{ section: "asc" }, { name: "asc" }] },
      meta: true,
    },
  });

  if (!auditRun) return new Response("Not found", { status: 404 });
  if (auditRun.status !== "done") {
    return new Response("Audit not complete", { status: 400 });
  }

  // Previous run for delta scores
  const prevRun = await db.auditRun.findFirst({
    where: {
      pageId: auditRun.pageId,
      status: "done",
      createdAt: { lt: auditRun.createdAt },
    },
    orderBy: { createdAt: "desc" },
    select: {
      overallScore: true,
      technicalScore: true,
      contentScore: true,
      semScore: true,
      meta: { select: { rawCrawlData: true } },
    },
  });

  const meta = auditRun.meta;

  const buffer = await generateDocxReport({
    businessName: meta?.businessName ?? auditRun.page.project.name,
    url: auditRun.url,
    createdAt: auditRun.createdAt,
    provider: auditRun.provider,
    overallScore: auditRun.overallScore,
    overallGrade: auditRun.overallGrade,
    technicalScore: auditRun.technicalScore,
    technicalGrade: auditRun.technicalGrade,
    contentScore: auditRun.contentScore,
    contentGrade: auditRun.contentGrade,
    semScore: auditRun.semScore,
    semGrade: auditRun.semGrade,

    prevOverallScore: prevRun?.overallScore,
    prevTechnicalScore: prevRun?.technicalScore,
    prevContentScore: prevRun?.contentScore,
    prevSemScore: prevRun?.semScore,

    technicalChecks: auditRun.checks
      .filter((c) => c.section === "technical")
      .map((c) => c as ReportCheck),
    contentChecks: auditRun.checks
      .filter((c) => c.section === "content")
      .map((c) => c as ReportCheck),
    semChecks: auditRun.checks
      .filter((c) => c.section === "sem")
      .map((c) => c as ReportCheck),

    executiveSummary: meta?.executiveSummary ?? "",
    keyStrengths: meta?.keyStrengths ?? "",
    keyOpportunities: meta?.keyOpportunities ?? "",
    technicalPriorityActions:
      ((meta?.priorityActions as { technical?: string[] } | null)?.technical) ?? [],
    contentPriorityActions:
      ((meta?.priorityActions as { content?: string[] } | null)?.content) ?? [],
    semStrengths: (meta?.semStrengths ?? []) as unknown as string[],
    semIssues: (meta?.semIssues ?? []) as unknown as string[],
    campaignRecs: (meta?.campaignRecs ?? []) as unknown as string[],
    adGroups: (meta?.adGroups ?? []) as unknown as ReportAdGroup[],
    quickWins: (meta?.quickWins ?? []) as unknown as ReportQuickWin[],
    rawCrawlData: meta?.rawCrawlData as Record<string, unknown> | null,
    prevRawCrawlData: prevRun?.meta?.rawCrawlData as Record<string, unknown> | null,
  });

  const domain = new URL(auditRun.url).hostname
    .replace("www.", "")
    .replace(/\./g, "-");
  const date = auditRun.createdAt.toISOString().split("T")[0];
  const filename = `SEO-Report-${domain}-${date}.docx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
