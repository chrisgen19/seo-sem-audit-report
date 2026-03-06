import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDate } from "@/lib/utils";
import { Plus, Globe, ChevronRight, FileText } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const projects = await db.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { pages: true } },
      pages: {
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
            },
          },
        },
      },
    },
  });

  const totalPages = projects.reduce((sum, p) => sum + p._count.pages, 0);

  // Find latest audit across all pages for avg score calculation
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
        subtitle="Manage your SEO audit projects"
        actions={
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Projects</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Pages</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalPages}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Avg. Overall Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgScore ?? "—"}</p>
        </div>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No projects yet. Add your first site to get started.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            // Get the most recent audit across all pages
            const allRuns = project.pages.flatMap((pg) => pg.auditRuns);
            const latest = allRuns.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-500 hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-400">{project.domain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FileText className="h-4 w-4" />
                    {project._count.pages} {project._count.pages === 1 ? "page" : "pages"}
                  </div>

                  {latest ? (
                    <>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Last audit</p>
                        <p className="text-sm text-gray-600">{formatDate(latest.createdAt)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-1">Score</p>
                        {latest.overallScore !== null ? (
                          <ScoreBadge score={latest.overallScore!} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center hidden md:grid">
                        {[
                          { label: "Tech", score: latest.technicalScore },
                          { label: "Content", score: latest.contentScore },
                          { label: "SEM", score: latest.semScore },
                        ].map(({ label, score }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-400">{label}</p>
                            {score !== null ? (
                              <ScoreBadge score={score!} />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No audits yet</span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-brand-500 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
