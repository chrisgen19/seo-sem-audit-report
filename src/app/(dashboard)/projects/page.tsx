import { auth } from "@/lib/auth";
import { getCachedProjects } from "@/lib/cache";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ScoreBadge } from "@/components/audit/score-card";
import { formatDate } from "@/lib/utils";
import { Plus, Globe, ChevronRight, FileText } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();

  const projects = await getCachedProjects(session!.user.organizationId!);

  return (
    <div>
      <Header
        title="Projects"
        subtitle={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
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
                  <div className="h-10 w-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
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
                      <div className="grid grid-cols-5 gap-2 text-center hidden md:grid">
                        {(() => {
                          const rawCrawl = latest.meta?.rawCrawlData as Record<string, unknown> | null;
                          const psiMobile = (rawCrawl?.psi as Record<string, unknown> | undefined)?.performance_score as number | undefined;
                          const psiDesktop = (rawCrawl?.psi_desktop as Record<string, unknown> | undefined)?.performance_score as number | undefined;
                          return [
                            { label: "Tech", score: latest.technicalScore },
                            { label: "Content", score: latest.contentScore },
                            { label: "SEM", score: latest.semScore },
                            { label: "PSI M", score: psiMobile ?? null },
                            { label: "PSI D", score: psiDesktop ?? null },
                          ].map(({ label, score }) => (
                            <div key={label}>
                              <p className="text-xs text-gray-400">{label}</p>
                              {score !== null ? (
                                <ScoreBadge score={score!} />
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </div>
                          ));
                        })()}
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
