import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScoreCard } from "@/components/audit/score-card";
import { ChecksTable } from "@/components/audit/checks-table";
import { QuickWinsTable } from "@/components/audit/quick-wins-table";
import { ScoreTrendChart } from "@/components/audit/score-trend-chart";
import { SectionNav } from "@/components/audit/section-nav";
import { formatDateTime } from "@/lib/utils";
import { Play, ChevronLeft, Download } from "lucide-react";
import type { QuickWin, AdGroup, PsiResult } from "@/types/audit";
import type { AuditCheck } from "@prisma/client";
import { PsiSection } from "@/components/audit/psi-section";

function statusCounts(checks: { status: string }[]) {
  let fail = 0, warn = 0, pass = 0;
  for (const c of checks) {
    if (c.status === "FAIL") fail++;
    else if (c.status === "WARN") warn++;
    else pass++;
  }
  return { fail, warn, pass };
}

export default async function AuditResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const auditRun = await db.auditRun.findFirst({
    where: { id, page: { project: { organizationId: session!.user.organizationId! } } },
    include: {
      page: {
        select: {
          id: true,
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
      checks: { orderBy: [{ section: "asc" }, { name: "asc" }] },
      meta: true,
    },
  });

  if (!auditRun) notFound();

  // Get previous run for delta comparison
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

  // Fetch all done runs for score trend chart
  const allDoneRuns = await db.auditRun.findMany({
    where: { pageId: auditRun.pageId, status: "done" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      overallScore: true,
      technicalScore: true,
      contentScore: true,
      semScore: true,
      meta: { select: { rawCrawlData: true } },
    },
  });

  const trendRuns = allDoneRuns.map((r) => {
    const raw = r.meta?.rawCrawlData as Record<string, unknown> | null;
    const psiM = (raw?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    const psiD = (raw?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      overallScore: r.overallScore,
      technicalScore: r.technicalScore,
      contentScore: r.contentScore,
      semScore: r.semScore,
      psiMobile: psiM ?? null,
      psiDesktop: psiD ?? null,
    };
  });

  const techChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "technical");
  const contentChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "content");
  const semChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "sem");

  const techCounts = statusCounts(techChecks);
  const contentCounts = statusCounts(contentChecks);
  const semCounts = statusCounts(semChecks);

  const meta = auditRun.meta;
  const quickWins = (meta?.quickWins ?? []) as unknown as QuickWin[];
  const adGroups = (meta?.adGroups ?? []) as unknown as AdGroup[];
  const priorityActions = (meta?.priorityActions ?? null) as unknown as
    | { technical: string[]; content: string[]; sem: string[] }
    | null;
  const semStrengths = (meta?.semStrengths ?? []) as unknown as string[];
  const semIssues = (meta?.semIssues ?? []) as unknown as string[];
  const campaignRecs = (meta?.campaignRecs ?? []) as unknown as string[];

  // Extract PSI data from raw crawl data
  const rawCrawl = meta?.rawCrawlData as Record<string, unknown> | null;
  const psiMobile = (rawCrawl?.psi ?? null) as PsiResult | null;
  const psiDesktop = (rawCrawl?.psi_desktop ?? null) as PsiResult | null;
  const psiError = (rawCrawl?.psi_error ?? null) as string | null;

  // Previous run's PSI scores for delta comparison
  const prevRawCrawl = prevRun?.meta?.rawCrawlData as Record<string, unknown> | null;
  const prevPsiMobile = (prevRawCrawl?.psi ?? null) as PsiResult | null;
  const prevPsiDesktop = (prevRawCrawl?.psi_desktop ?? null) as PsiResult | null;

  const projectId = auditRun.page.project.id;
  const pageId = auditRun.page.id;

  const hasPsi = !!(psiMobile || psiDesktop || psiError);

  // Build nav items
  const navItems = [
    { id: "scores", label: "Scores" },
    { id: "executive-summary", label: "Summary" },
    ...(hasPsi ? [{ id: "psi", label: "PageSpeed" }] : []),
    { id: "technical-seo", label: "Technical SEO" },
    { id: "content-seo", label: "Content SEO" },
    { id: "sem-readiness", label: "SEM" },
    { id: "quick-wins", label: "Quick Wins" },
    ...(trendRuns.length >= 2 ? [{ id: "score-trend", label: "Trend" }] : []),
  ];

  const headerTitle = meta?.businessName ?? auditRun.page.project.name;
  const headerSubtitle = [
    auditRun.url,
    formatDateTime(auditRun.createdAt),
    `via ${auditRun.provider}`,
    ...(meta?.businessDesc ? [`— ${meta.businessDesc}`] : []),
  ].join(" · ");

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/projects/${projectId}/pages/${pageId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-700 mb-4 transition-colors print:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
        {auditRun.page.name} — {auditRun.page.project.name}
      </Link>

      {/* Sticky header with nav + actions */}
      <SectionNav
        items={navItems}
        title={headerTitle}
        subtitle={headerSubtitle}
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/audits/${id}/export`}
              download
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export DOCX</span>
            </a>
            <Link
              href={`/projects/${projectId}/pages/${pageId}/run`}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Re-audit</span>
            </Link>
          </div>
        }
      />

      {/* Score cards */}
      <div id="scores" className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 mt-6">
        <ScoreCard
          label="Overall"
          score={auditRun.overallScore ?? 0}
          grade={auditRun.overallGrade ?? "N/A"}
          previousScore={prevRun?.overallScore ?? undefined}
        />
        <ScoreCard
          label="Technical SEO"
          score={auditRun.technicalScore ?? 0}
          grade={auditRun.technicalGrade ?? "N/A"}
          previousScore={prevRun?.technicalScore ?? undefined}
        />
        <ScoreCard
          label="Content SEO"
          score={auditRun.contentScore ?? 0}
          grade={auditRun.contentGrade ?? "N/A"}
          previousScore={prevRun?.contentScore ?? undefined}
        />
        <ScoreCard
          label="SEM Readiness"
          score={auditRun.semScore ?? 0}
          grade={auditRun.semGrade ?? "N/A"}
          previousScore={prevRun?.semScore ?? undefined}
        />
        {psiMobile && (
          <ScoreCard
            label="PageSpeed (Mobile)"
            score={psiMobile.performance_score}
            previousScore={prevPsiMobile?.performance_score}
          />
        )}
        {psiDesktop && (
          <ScoreCard
            label="PageSpeed (Desktop)"
            score={psiDesktop.performance_score}
            previousScore={prevPsiDesktop?.performance_score}
          />
        )}
      </div>

      {/* Executive summary */}
      {meta && (
        <div id="executive-summary" className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print:break-inside-avoid">
          <h2 className="font-semibold text-gray-900 mb-3">Executive Summary</h2>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-2">
            {meta.executiveSummary.split("\n").filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Strengths</p>
              <p className="text-sm text-gray-700">{meta.keyStrengths}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Opportunities</p>
              <p className="text-sm text-gray-700">{meta.keyOpportunities}</p>
            </div>
          </div>
        </div>
      )}

      {/* PageSpeed Insights */}
      {hasPsi && (
        <Section id="psi" title="PageSpeed Insights (Core Web Vitals)">
          <PsiSection mobile={psiMobile} desktop={psiDesktop} psiError={psiError} />
        </Section>
      )}

      {/* Technical SEO */}
      <Section id="technical-seo" title="1. Technical SEO" counts={techCounts}>
        <ChecksTable checks={techChecks} />
        {priorityActions?.technical?.length ? (
          <PriorityList items={priorityActions.technical} />
        ) : null}
      </Section>

      {/* Content SEO */}
      <Section id="content-seo" title="2. Content SEO" counts={contentCounts}>
        <ChecksTable checks={contentChecks} />
        {priorityActions?.content?.length ? (
          <PriorityList items={priorityActions.content} />
        ) : null}
      </Section>

      {/* SEM */}
      <Section id="sem-readiness" title="3. SEM / Google Ads Readiness" counts={semCounts}>
        <ChecksTable checks={semChecks} />

        {(semStrengths.length > 0 || semIssues.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {semStrengths.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2">Landing Page Strengths</p>
                <ul className="space-y-1">
                  {semStrengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {semIssues.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-600 mb-2">Issues</p>
                <ul className="space-y-1">
                  {semIssues.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-red-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ad groups */}
        {adGroups.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recommended Ad Groups</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Ad Group</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Target Keywords</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Why This Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adGroups.map((g, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                      <td className="px-4 py-3 text-gray-700">{g.keywords}</td>
                      <td className="px-4 py-3 text-gray-500">{g.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {campaignRecs.length > 0 && <PriorityList items={campaignRecs} label="Campaign Recommendations" />}
      </Section>

      {/* Quick wins */}
      <Section id="quick-wins" title="4. Quick Wins">
        <QuickWinsTable wins={quickWins} />
      </Section>

      {/* Score trend chart */}
      {trendRuns.length >= 2 && (
        <div id="score-trend" className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print:hidden">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Score Trend</h2>
          <ScoreTrendChart runs={trendRuns} />
        </div>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  counts,
  children,
}: {
  id: string;
  title: string;
  counts?: { fail: number; warn: number; pass: number };
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print:break-inside-avoid">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
        {counts && (
          <div className="flex items-center gap-2">
            {counts.fail > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700">
                {counts.fail} Fail
              </span>
            )}
            {counts.warn > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700">
                {counts.warn} Warn
              </span>
            )}
            {counts.pass > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
                {counts.pass} Pass
              </span>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function PriorityList({ items, label = "Priority Actions" }: { items: string[]; label?: string }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{label}</h3>
      <ol className="space-y-2">
        {items.map((action, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-700">
            <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-900 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            {action}
          </li>
        ))}
      </ol>
    </div>
  );
}
