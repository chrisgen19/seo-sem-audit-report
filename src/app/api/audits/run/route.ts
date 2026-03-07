import { getOrgContext } from "@/lib/org";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { decrypt } from "@/lib/encrypt";
import { SEOCrawler } from "@/lib/crawler";
import { analyzeWithClaude, analyzeWithGemini } from "@/lib/analyzer";
import { computeScores } from "@/lib/scoring";
import { enrichFindings } from "@/lib/enrich";
import type { AnalysisResult, AuditStreamEvent } from "@/types/audit";
import { z } from "zod";

export const maxDuration = 300;

const bodySchema = z.object({
  pageId: z.string().min(1),
  provider: z.enum(["claude", "gemini"]),
});

function sseEncoder() {
  const encoder = new TextEncoder();
  return (event: AuditStreamEvent) =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

async function saveAuditToDb(
  auditRunId: string,
  analysis: AnalysisResult,
  crawlData: Record<string, unknown>
) {
  const techChecks = analysis.technical_seo.checks.map((c) => ({
    auditRunId,
    section: "technical",
    name: c.name,
    status: c.status,
    finding: c.finding,
    recommendation: c.recommendation,
  }));
  const contentChecks = analysis.content_seo.checks.map((c) => ({
    auditRunId,
    section: "content",
    name: c.name,
    status: c.status,
    finding: c.finding,
    recommendation: c.recommendation,
  }));
  const semChecks = analysis.sem_readiness.checks.map((c) => ({
    auditRunId,
    section: "sem",
    name: c.name,
    status: c.status,
    finding: c.finding,
    recommendation: c.recommendation,
  }));

  await db.auditCheck.createMany({
    data: [...techChecks, ...contentChecks, ...semChecks],
  });

  await db.auditMeta.create({
    data: {
      auditRunId,
      businessName: analysis.business_name,
      businessDesc: analysis.business_description,
      executiveSummary: analysis.executive_summary,
      keyStrengths: analysis.key_strengths,
      keyOpportunities: analysis.key_opportunities,
      quickWins: analysis.quick_wins as unknown as Prisma.InputJsonValue,
      adGroups: analysis.sem_readiness.ad_groups as unknown as Prisma.InputJsonValue,
      priorityActions: {
        technical: analysis.technical_seo.priority_actions,
        content: analysis.content_seo.priority_actions,
        sem: analysis.sem_readiness.campaign_recommendations,
      } as unknown as Prisma.InputJsonValue,
      semStrengths: analysis.sem_readiness.strengths as unknown as Prisma.InputJsonValue,
      semIssues: analysis.sem_readiness.issues as unknown as Prisma.InputJsonValue,
      campaignRecs: analysis.sem_readiness.campaign_recommendations as unknown as Prisma.InputJsonValue,
      rawCrawlData: crawlData as unknown as Prisma.InputJsonValue,
    },
  });

  await db.auditRun.update({
    where: { id: auditRunId },
    data: {
      status: "done",
      completedAt: new Date(),
      overallScore: analysis.overall_score,
      overallGrade: analysis.overall_grade,
      technicalScore: analysis.technical_seo.score,
      technicalGrade: analysis.technical_seo.grade,
      contentScore: analysis.content_seo.score,
      contentGrade: analysis.content_seo.grade,
      semScore: analysis.sem_readiness.score,
      semGrade: analysis.sem_readiness.grade,
    },
  });
}

export async function POST(req: Request) {
  const ctx = await getOrgContext();
  if (!ctx) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { pageId, provider } = parsed.data;

  // Verify access via Page → Project → Organization
  const page = await db.page.findFirst({
    where: { id: pageId, project: { organizationId: ctx.organizationId } },
    include: { project: { select: { id: true, name: true } } },
  });
  if (!page) {
    return Response.json({ error: "Page not found" }, { status: 404 });
  }

  // Get and decrypt the current user's API key + model preference
  const user = await db.user.findUnique({ where: { id: ctx.userId } });
  const rawKey = provider === "gemini" ? user?.geminiApiKey : user?.claudeApiKey;
  const modelOverride = provider === "gemini" ? user?.geminiModel : user?.claudeModel;
  if (!rawKey) {
    return Response.json(
      { error: `No ${provider === "gemini" ? "Gemini" : "Claude"} API key set. Go to Settings to add one.` },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(rawKey);
  } catch {
    return Response.json({ error: "Failed to decrypt API key." }, { status: 500 });
  }

  // Auto-expire stale runs older than 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  await db.auditRun.updateMany({
    where: { pageId, status: "running", createdAt: { lt: fiveMinAgo } },
    data: { status: "failed", errorMessage: "Timed out — run exceeded 5 minutes" },
  });

  // Prevent duplicate runs — if one is already running for this page, reject
  const existingRun = await db.auditRun.findFirst({
    where: { pageId, status: "running" },
    orderBy: { createdAt: "desc" },
  });
  if (existingRun) {
    return Response.json(
      { error: "An audit is already running for this page. Please wait for it to complete." },
      { status: 409 }
    );
  }

  // Create audit run record
  const auditRun = await db.auditRun.create({
    data: { pageId, url: page.url, status: "running", provider },
  });

  const encode = sseEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AuditStreamEvent) => {
        try {
          controller.enqueue(encode(event));
        } catch {
          /* stream already closed */
        }
      };

      try {
        // Step 1: Crawl
        const crawler = new SEOCrawler(page.url, (message) => {
          send({ step: "crawl", message });
        });
        send({ step: "crawl", message: `Starting crawl of ${page.url}...` });
        const crawlData = await crawler.crawl();
        send({ step: "crawl_done", message: "Crawl complete." });

        // Step 2: AI Analysis
        const modelLabel = modelOverride || (provider === "gemini" ? "Gemini" : "Claude");
        send({
          step: "analyze",
          message: `Sending to ${modelLabel} for analysis (this takes 30–60s)...`,
        });

        const onRetry = (attempt: number, maxRetries: number, delaySec: number) => {
          send({
            step: "analyze",
            message: `Attempt ${attempt}/${maxRetries} failed — retrying in ${delaySec}s...`,
          });
        };

        let analysis: AnalysisResult;
        if (provider === "gemini") {
          analysis = await analyzeWithGemini(crawlData, apiKey, { model: modelOverride, onRetry });
        } else {
          analysis = await analyzeWithClaude(crawlData, apiKey, { model: modelOverride, onRetry });
        }
        send({ step: "analyze_done", message: "AI analysis complete." });

        // Step 3: Score
        send({ step: "scoring", message: "Computing scores from fixed rubric..." });
        const scored = computeScores(analysis);

        // Step 3b: Enrich findings with crawl data evidence
        const enriched = enrichFindings(scored, crawlData);

        // Step 4: Save
        send({ step: "saving", message: "Saving results to database..." });
        await saveAuditToDb(auditRun.id, enriched, crawlData as Record<string, unknown>);

        send({ step: "done", auditId: auditRun.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ step: "error", message });
        await db.auditRun
          .update({
            where: { id: auditRun.id },
            data: { status: "failed", errorMessage: message },
          })
          .catch(() => {});
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
