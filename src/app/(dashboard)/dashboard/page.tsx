import { auth } from "@/lib/auth";
import { getCachedDashboardData } from "@/lib/cache";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDateTime } from "@/lib/utils";
import { Globe, ChevronRight, BarChart2, FileText, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const orgId = session?.user.organizationId ?? null;
  const userId = session!.user.id;

  const { projects, recentAudits } = await getCachedDashboardData({ orgId, userId });

  const totalPages = projects.reduce((sum, p) => sum + p._count.pages, 0);
  const allLatestScores = projects
    .flatMap((p) => p.pages.flatMap((pg) => pg.auditRuns.map((r) => r.overallScore)))
    .filter((s): s is number => s !== null);
  const avgScore = allLatestScores.length
    ? Math.round(allLatestScores.reduce((a, b) => a + b, 0) / allLatestScores.length)
    : null;

  return (
    <div>
      <Header
        title={`Welcome back, ${session?.user?.name ?? "there"}`}
        subtitle="Your SEO audit overview"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Projects</p>
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pages tracked</p>
            <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <BarChart2 className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg. score</p>
            <p className="text-2xl font-bold text-gray-900">{avgScore ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Recent Audits */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Recent Audits</h2>
          </div>
          <Link
            href="/projects"
            className="text-sm text-brand-700 hover:text-brand-900 transition-colors"
          >
            View all projects
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 mb-3">No audits yet.</p>
            <Link
              href="/projects"
              className="text-sm text-brand-700 hover:text-brand-900 font-medium transition-colors"
            >
              Go to Projects to get started
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentAudits.map((audit) => (
              <div
                key={audit.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors gap-4"
              >
                {/* Breadcrumb */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm flex-wrap">
                    <Link
                      href={`/projects/${audit.page.project.id}`}
                      className="text-gray-500 hover:text-brand-700 transition-colors truncate"
                    >
                      {audit.page.project.name}
                    </Link>
                    <span className="text-gray-300">/</span>
                    <Link
                      href={`/projects/${audit.page.project.id}/pages/${audit.page.id}`}
                      className="font-medium text-gray-900 hover:text-brand-700 transition-colors truncate"
                    >
                      {audit.page.name}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(audit.createdAt)} · {audit.provider}
                  </p>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="grid grid-cols-4 gap-3 text-center hidden sm:grid">
                    {[
                      { label: "Overall", score: audit.overallScore },
                      { label: "Tech", score: audit.technicalScore },
                      { label: "Content", score: audit.contentScore },
                      { label: "SEM", score: audit.semScore },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        {score !== null ? (
                          <ScoreBadge score={score!} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/audits/${audit.id}`}
                    className="flex items-center gap-0.5 text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    View <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
