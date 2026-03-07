import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreTrendChart, ScoreSummaryRow } from "@/components/audit/score-trend-chart";
import { AuditHistoryTable } from "@/components/audit/audit-history-table";
import type { AuditRunRow } from "@/components/audit/audit-history-table";
import { Play, ChevronLeft, ExternalLink } from "lucide-react";

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const session = await auth();
  const { id, pageId } = await params;

  const page = await db.page.findFirst({
    where: { id: pageId, projectId: id, project: { organizationId: session!.user.organizationId! } },
    include: {
      project: { select: { id: true, name: true } },
      auditRuns: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          provider: true,
          overallScore: true,
          overallGrade: true,
          technicalScore: true,
          technicalGrade: true,
          contentScore: true,
          contentGrade: true,
          semScore: true,
          semGrade: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
          meta: { select: { rawCrawlData: true } },
        },
      },
    },
  });

  if (!page) notFound();

  const doneRuns = page.auditRuns.filter((r) => r.status === "done");
  const latestRun = [...doneRuns].reverse()[0];

  // For score trend chart
  const doneRunsWithPsi = doneRuns.map((r) => {
    const raw = r.meta?.rawCrawlData as Record<string, unknown> | null;
    const psiM = (raw?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    const psiD = (raw?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    return { ...r, psiMobile: psiM ?? null, psiDesktop: psiD ?? null };
  });

  // Serialized for the client-side audit history table
  const serializedRuns: AuditRunRow[] = [...page.auditRuns].reverse().map((run) => {
    const raw = run.meta?.rawCrawlData as Record<string, unknown> | null;
    const psiM = (raw?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    const psiD = (raw?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    return {
      id: run.id,
      status: run.status,
      provider: run.provider,
      overallScore: run.overallScore,
      technicalScore: run.technicalScore,
      contentScore: run.contentScore,
      semScore: run.semScore,
      createdAt: run.createdAt.toISOString(),
      errorMessage: run.errorMessage ?? null,
      psiMobile: psiM ?? null,
      psiDesktop: psiD ?? null,
    };
  });

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-700 mb-4 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {page.project.name}
      </Link>

      <Header
        title={page.name}
        subtitle={page.url}
        actions={
          <Link
            href={`/projects/${id}/pages/${pageId}/run`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Play className="h-4 w-4" />
            Run Audit
          </Link>
        }
      />

      {/* Score trend */}
      {doneRuns.length > 0 && (() => {
        const latestWithPsi = doneRunsWithPsi[doneRunsWithPsi.length - 1];
        const prevWithPsi = doneRunsWithPsi.length >= 2 ? doneRunsWithPsi[doneRunsWithPsi.length - 2] : null;

        const summaryScores = [
          { label: "Overall", current: latestRun?.overallScore ?? null, previous: prevWithPsi?.overallScore ?? null, color: "#1F4E79" },
          { label: "Technical", current: latestRun?.technicalScore ?? null, previous: prevWithPsi?.technicalScore ?? null, color: "#2196F3" },
          { label: "Content", current: latestRun?.contentScore ?? null, previous: prevWithPsi?.contentScore ?? null, color: "#27AE60" },
          { label: "SEM", current: latestRun?.semScore ?? null, previous: prevWithPsi?.semScore ?? null, color: "#F39C12" },
          { label: "PSI Mobile", current: latestWithPsi?.psiMobile ?? null, previous: prevWithPsi?.psiMobile ?? null, color: "#E74C3C" },
          { label: "PSI Desktop", current: latestWithPsi?.psiDesktop ?? null, previous: prevWithPsi?.psiDesktop ?? null, color: "#9B59B6" },
        ];

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Score Trend</h2>
              <span className="text-xs text-gray-400">
                {doneRunsWithPsi.length} audit{doneRunsWithPsi.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ScoreSummaryRow scores={summaryScores} />
            <ScoreTrendChart runs={doneRunsWithPsi} />
          </div>
        );
      })()}

      {/* Audit history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Audit History</h2>
          <span className="text-sm text-gray-400">{page.auditRuns.length} runs</span>
        </div>

        {page.auditRuns.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 mb-4">No audits yet.</p>
            <Link
              href={`/projects/${id}/pages/${pageId}/run`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
            >
              <Play className="h-4 w-4" />
              Run first audit
            </Link>
          </div>
        ) : (
          <AuditHistoryTable
            runs={serializedRuns}
            projectId={id}
            pageId={pageId}
          />
        )}
      </div>

      {/* Page meta */}
      <div className="mt-4">
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          {page.url}
        </a>
      </div>
    </div>
  );
}
