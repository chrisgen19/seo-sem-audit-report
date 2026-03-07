import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreCard } from "@/components/audit/score-card";
import { ChecksTable } from "@/components/audit/checks-table";
import { QuickWinsTable } from "@/components/audit/quick-wins-table";
import { formatDateTime } from "@/lib/utils";
import { Play, ChevronLeft, Download } from "lucide-react";
import type { QuickWin, AdGroup, PsiResult } from "@/types/audit";
import type { AuditCheck } from "@prisma/client";
import { PsiSection } from "@/components/audit/psi-section";

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

  const techChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "technical");
  const contentChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "content");
  const semChecks = auditRun.checks.filter((c: AuditCheck) => c.section === "sem");

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

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/projects/${projectId}/pages/${pageId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-700 mb-4 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {auditRun.page.name} — {auditRun.page.project.name}
      </Link>

      <Header
        title={meta?.businessName ?? auditRun.page.project.name}
        subtitle={`${auditRun.url} — ${formatDateTime(auditRun.createdAt)} via ${auditRun.provider}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`/api/audits/${id}/export`}
              download
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export DOCX
            </a>
            <Link
              href={`/projects/${projectId}/pages/${pageId}/run`}
              className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <Play className="h-4 w-4" />
              Re-audit
            </Link>
          </div>
        }
      />

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
      {(psiMobile || psiDesktop || psiError) && (
        <Section title="PageSpeed Insights (Core Web Vitals)">
          <PsiSection mobile={psiMobile} desktop={psiDesktop} psiError={psiError} />
        </Section>
      )}

      {/* Technical SEO */}
      <Section title="1. Technical SEO">
        <ChecksTable checks={techChecks} />
        {priorityActions?.technical?.length ? (
          <PriorityList items={priorityActions.technical} />
        ) : null}
      </Section>

      {/* Content SEO */}
      <Section title="2. Content SEO">
        <ChecksTable checks={contentChecks} />
        {priorityActions?.content?.length ? (
          <PriorityList items={priorityActions.content} />
        ) : null}
      </Section>

      {/* SEM */}
      <Section title="3. SEM / Google Ads Readiness">
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
      <Section title="4. Quick Wins">
        <QuickWinsTable wins={quickWins} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="font-semibold text-gray-900 text-lg mb-4">{title}</h2>
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
