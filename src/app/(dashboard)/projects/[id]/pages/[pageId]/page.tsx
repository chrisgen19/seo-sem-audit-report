import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { ScoreTrendChart } from "@/components/audit/score-trend-chart";
import { formatDateTime } from "@/lib/utils";
import { Play, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { DeleteAuditButton } from "@/components/audit/delete-audit-button";

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

  // Extract PSI scores for chart and history
  const doneRunsWithPsi = doneRuns.map((r) => {
    const raw = r.meta?.rawCrawlData as Record<string, unknown> | null;
    const psiM = (raw?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    const psiD = (raw?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
    return { ...r, psiMobile: psiM ?? null, psiDesktop: psiD ?? null };
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

      {/* Score trend chart */}
      {doneRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Score Trend</h2>
            {latestRun && (
              <span className="text-sm text-gray-500">
                Latest:{" "}
                <span className="font-bold text-gray-900">
                  {latestRun.overallScore}/100 ({latestRun.overallGrade})
                </span>
              </span>
            )}
          </div>
          <ScoreTrendChart runs={doneRunsWithPsi} />
        </div>
      )}

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
          <div className="divide-y divide-gray-50">
            {[...page.auditRuns].reverse().map((run) => {
              const raw = run.meta?.rawCrawlData as Record<string, unknown> | null;
              const psiM = (raw?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
              const psiD = (raw?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
              return (
              <div key={run.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(run.createdAt)}</p>
                  <p className="text-xs text-gray-400 capitalize">{run.provider}</p>
                </div>

                <div className="flex items-center gap-6">
                  {run.status === "done" ? (
                    <>
                      <div className="grid grid-cols-6 gap-3 text-center">
                        {[
                          { label: "Overall", score: run.overallScore },
                          { label: "Tech", score: run.technicalScore },
                          { label: "Content", score: run.contentScore },
                          { label: "SEM", score: run.semScore },
                          { label: "PSI M", score: psiM ?? null },
                          { label: "PSI D", score: psiD ?? null },
                        ].map(({ label, score }) => (
                          <div key={label} className="text-center">
                            <p className="text-xs text-gray-400">{label}</p>
                            {score !== null ? (
                              <ScoreBadge score={score!} />
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/audits/${run.id}`}
                        className="flex items-center gap-1 text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </Link>
                    </>
                  ) : run.status === "failed" ? (
                    <span className="text-sm text-red-500">
                      Failed{run.errorMessage ? `: ${run.errorMessage.slice(0, 60)}` : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-amber-600 capitalize">{run.status}</span>
                  )}
                  <DeleteAuditButton auditId={run.id} />
                </div>
              </div>
              );
            })}
          </div>
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
